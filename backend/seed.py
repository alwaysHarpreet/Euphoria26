import argparse
import csv
import sys
from pathlib import Path
from typing import Any

# Ensure backend directory is in sys.path so 'app' can be imported
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.problem import ProblemStatement
from app.schemas.admin_problem import AdminProblemCreate


def parse_boolean(val: Any, default: bool = True) -> bool:
    """Parse boolean from CSV string values."""
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    cleaned = str(val).strip().lower()
    if cleaned in ("true", "1", "yes", "y", "active"):
        return True
    if cleaned in ("false", "0", "no", "n", "inactive"):
        return False
    return default


def normalize_row_dict(row: dict[str, str]) -> dict[str, str]:
    """Normalize CSV row keys to snake_case."""
    normalized: dict[str, str] = {}
    for key, value in row.items():
        if key is None:
            continue
        norm_key = key.strip().lower().replace(" ", "_").replace("-", "_")
        normalized[norm_key] = value.strip() if value else ""
    return normalized


def extract_problem_fields(row: dict[str, str]) -> dict[str, Any]:
    """Extract and map possible column names to title, description, and is_active."""
    # Title aliases
    title = (
        row.get("title")
        or row.get("problem_title")
        or row.get("name")
        or row.get("problem_name")
        or ""
    )

    # Description aliases
    description = (
        row.get("description")
        or row.get("problem_description")
        or row.get("problem_statement")
        or row.get("details")
        or ""
    )

    # is_active aliases
    raw_active = (
        row.get("is_active")
        if "is_active" in row
        else row.get("active", row.get("status", None))
    )
    is_active = parse_boolean(raw_active, default=True)

    return {
        "title": title,
        "description": description,
        "is_active": is_active,
    }


def seed_problems_from_csv(
    csv_file_path: Path,
    update_existing: bool = False,
    dry_run: bool = False,
) -> None:
    if not csv_file_path.exists():
        print(f"[-] Error: File not found at {csv_file_path}")
        sys.exit(1)

    print(f"[*] Reading problem statements from: {csv_file_path}")
    if dry_run:
        print("[!] DRY RUN MODE: No database changes will be saved.")

    db: Session = SessionLocal()
    added_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0

    try:
        with open(csv_file_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                print("[-] Error: CSV file is empty or missing headers.")
                sys.exit(1)

            rows = list(reader)
            total_rows = len(rows)
            print(f"[*] Found {total_rows} row(s) in CSV.\n")

            for index, raw_row in enumerate(rows, start=1):
                normalized = normalize_row_dict(raw_row)
                fields = extract_problem_fields(normalized)

                # Validate with Pydantic schema
                try:
                    problem_in = AdminProblemCreate(
                        title=fields["title"],
                        description=fields["description"],
                        is_active=fields["is_active"],
                    )
                except ValidationError as err:
                    error_count += 1
                    error_msgs = "; ".join(
                        f"{e['loc'][0]}: {e['msg']}" for e in err.errors()
                    )
                    print(
                        f"  [Row {index}] Skipping invalid data for '{fields.get('title', 'Unknown')}': {error_msgs}"
                    )
                    continue

                # Query database for existing problem
                existing_problem = db.scalar(
                    select(ProblemStatement).where(
                        ProblemStatement.title == problem_in.title
                    )
                )

                if existing_problem:
                    if update_existing:
                        if not dry_run:
                            existing_problem.description = problem_in.description
                            existing_problem.is_active = problem_in.is_active
                        updated_count += 1
                        print(
                            f"  [Row {index}] Updated: \"{problem_in.title}\""
                        )
                    else:
                        skipped_count += 1
                        print(
                            f"  [Row {index}] Skipped (already exists): \"{problem_in.title}\""
                        )
                else:
                    if not dry_run:
                        new_problem = ProblemStatement(
                            title=problem_in.title,
                            description=problem_in.description,
                            is_active=problem_in.is_active,
                        )
                        db.add(new_problem)
                    added_count += 1
                    print(
                        f"  [Row {index}] Added: \"{problem_in.title}\""
                    )

        if not dry_run:
            db.commit()
            print("\n[+] Database transaction committed successfully!")
        else:
            db.rollback()
            print("\n[!] Dry run finished. No changes were committed.")

        print("--------------------------------------------------")
        print("Summary:")
        print(f"  Total processed: {total_rows}")
        print(f"  Added:           {added_count}")
        print(f"  Updated:         {updated_count}")
        print(f"  Skipped:         {skipped_count}")
        print(f"  Validation Errs: {error_count}")
        print("--------------------------------------------------")

        if not dry_run:
            all_problems = db.scalars(
                select(ProblemStatement).order_by(ProblemStatement.id)
            ).all()
            print(f"\nCurrent Problem Statements in DB ({len(all_problems)} total):")
            for p in all_problems:
                status_str = "Active" if p.is_active else "Inactive"
                print(f"  [{p.id}] {p.title} ({status_str})")

    except Exception as e:
        db.rollback()
        print(f"\n[-] Unexpected error occurred: {e}")
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Ingest Problem Statements from a CSV file into HackOdyssey."
    )
    parser.add_argument(
        "--file",
        "-f",
        type=str,
        default="problems.csv",
        help="Path to the CSV file to import (default: problems.csv)",
    )
    parser.add_argument(
        "--update",
        "-u",
        action="store_true",
        help="Update existing problem statement descriptions and active status if title matches",
    )
    parser.add_argument(
        "--dry-run",
        "-d",
        action="store_true",
        help="Validate CSV and show changes without saving to the database",
    )

    args = parser.parse_args()

    csv_path = Path(args.file)
    if not csv_path.is_absolute():
        # Resolve relative to current working directory or backend directory
        if not csv_path.exists() and (BACKEND_DIR / csv_path).exists():
            csv_path = BACKEND_DIR / csv_path
        else:
            csv_path = csv_path.resolve()

    seed_problems_from_csv(
        csv_file_path=csv_path,
        update_existing=args.update,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
