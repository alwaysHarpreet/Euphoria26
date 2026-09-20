import {
	useEffect,
	useState,
} from 'react'

import {
	Eye,
	ImageOff,
	Loader2,
	Search,
	Users,
	X,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface Team {
	id: number
	team_name: string
	college_name: string
	leader_name: string
	leader_email: string
	selected_problem_id: number | null
	group_photo_path: string | null
	created_at: string
}

function getPhotoUrl(path: string | null) {
	if (!path) {
		return null
	}

	if (path.startsWith('http')) {
		return path
	}

	return `${api.defaults.baseURL}/uploads/${path.replace(/^\//, '')}`
}

function getErrorMessage(error: unknown) {
	if (
		typeof error === 'object' &&
		error !== null &&
		'response' in error
	) {
		const response = error.response

		if (
			typeof response === 'object' &&
			response !== null &&
			'data' in response
		) {
			const data = response.data

			if (
				typeof data === 'object' &&
				data !== null &&
				'detail' in data &&
				typeof data.detail === 'string'
			) {
				return data.detail
			}
		}
	}

	return 'Unable to load teams.'
}

export default function AdminTeams() {
	const [teams, setTeams] = useState<Team[]>([])
	const [search, setSearch] = useState('')
	const [selectedTeam, setSelectedTeam] =
		useState<Team | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const fetchTeams = async () => {
			try {
				setLoading(true)
				setError('')

				const response = await api.get<Team[]>(
					'/admin/teams',
					{
						params: search.trim()
							? { search: search.trim() }
							: undefined,
					},
				)

				setTeams(response.data)
			} catch (requestError) {
				setError(getErrorMessage(requestError))
			} finally {
				setLoading(false)
			}
		}

		fetchTeams()
	}, [search])

	return (
		<AdminLayout>
			<div className="mx-auto max-w-[1400px]">
				<div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
							Admin Workspace
						</p>

						<h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
							Teams
						</h2>

						<p className="mt-2 text-sm text-gray-500">
							Review registered teams and their problem selections.
						</p>
					</div>

					<div className="relative w-full sm:max-w-xs">
						<Search
							size={17}
							strokeWidth={1.8}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
						/>

						<input
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search teams..."
							className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/25"
							aria-label="Search teams"
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
					{loading ? (
						<div className="flex min-h-[320px] items-center justify-center">
							<Loader2
								size={22}
								className="animate-spin text-gray-500"
							/>
						</div>
					) : error ? (
						<div className="flex min-h-[320px] items-center justify-center px-6 text-center">
							<p className="text-sm text-gray-400">{error}</p>
						</div>
					) : teams.length === 0 ? (
						<div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
							<Users size={28} className="text-gray-600" />
							<p className="mt-4 text-sm text-gray-400">
								{search.trim()
									? 'No teams match your search.'
									: 'No teams have been registered yet.'}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[900px] text-left text-sm">
								<thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-gray-600">
									<tr>
										<th className="px-6 py-4 font-medium">Team</th>
										<th className="px-6 py-4 font-medium">College</th>
										<th className="px-6 py-4 font-medium">Leader</th>
										<th className="px-6 py-4 font-medium">Email</th>
										<th className="px-6 py-4 font-medium">Problem</th>
										<th className="px-6 py-4 text-right font-medium">Action</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-white/[0.06]">
									{teams.map((team) => {
										const photoUrl = getPhotoUrl(team.group_photo_path)

										return (
											<tr
												key={team.id}
												className="transition hover:bg-white/[0.025]"
											>
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														{photoUrl ? (
															<img
																src={photoUrl}
																alt=""
																className="h-9 w-9 rounded-xl object-cover"
															/>
														) : (
															<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-gray-600">
																<ImageOff size={16} />
															</div>
														)}

														<span className="font-medium text-gray-200">
															{team.team_name}
														</span>
													</div>
												</td>
												<td className="px-6 py-4 text-gray-400">
													{team.college_name}
												</td>
												<td className="px-6 py-4 text-gray-400">
													{team.leader_name}
												</td>
												<td className="px-6 py-4 text-gray-500">
													{team.leader_email}
												</td>
												<td className="px-6 py-4 text-gray-400">
													{team.selected_problem_id ?? 'Not selected'}
												</td>
												<td className="px-6 py-4 text-right">
													<button
														type="button"
														onClick={() => setSelectedTeam(team)}
														className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
													>
														<Eye size={14} />
														View
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{selectedTeam && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
					role="presentation"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							setSelectedTeam(null)
						}
					}}
				>
					<div
						className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
						role="dialog"
						aria-modal="true"
						aria-labelledby="team-details-title"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
									Team details
								</p>
								<h3
									id="team-details-title"
									className="mt-2 text-xl font-semibold text-white"
								>
									{selectedTeam.team_name}
								</h3>
							</div>

							<button
								type="button"
								onClick={() => setSelectedTeam(null)}
								className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
								aria-label="Close team details"
							>
								<X size={18} />
							</button>
						</div>

						<div className="mt-6 grid gap-4 sm:grid-cols-2">
							<Detail label="College" value={selectedTeam.college_name} />
							<Detail label="Leader" value={selectedTeam.leader_name} />
							<Detail label="Email" value={selectedTeam.leader_email} />
							<Detail
								label="Selected problem"
								value={selectedTeam.selected_problem_id?.toString() ?? 'Not selected'}
							/>
							<Detail
								label="Registered"
								value={new Date(selectedTeam.created_at).toLocaleDateString()}
							/>
							<Detail label="Team ID" value={selectedTeam.id.toString()} />
						</div>
					</div>
				</div>
			)}
		</AdminLayout>
	)
}

interface DetailProps {
	label: string
	value: string
}

function Detail({ label, value }: DetailProps) {
	return (
		<div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
			<p className="text-[11px] text-gray-600">{label}</p>
			<p className="mt-2 break-words text-sm text-gray-300">{value}</p>
		</div>
	)
}
