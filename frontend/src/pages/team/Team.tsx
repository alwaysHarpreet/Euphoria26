import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  GraduationCap,
  Hash,
  Mail,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

interface Problem {
  id: number
  title: string
  description: string
  is_active: boolean
  created_at: string
}

interface TeamMember {
  id: number
  team_id: number
  name: string
  college: string
  year: string
  registration_number: string | null
  email: string | null
  role: string | null
  department: string | null
  created_at: string
}

interface TeamData {
  id: number
  team_code: string
  team_name: string
  college_name: string
  leader_name: string
  leader_email: string
  selected_problem: Problem | null
  group_photo_path: string | null
  group_photo_url: string | null
  repository_url: string | null
  repository_submitted_at: string | null
  members: TeamMember[]
  feedback: Feedback | null
  created_at: string
}

interface Feedback {
  id: number
  team_id: number
  feedback: string
  created_at: string
  updated_at: string
}

export default function Team() {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTeam = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<TeamData>('/teams/me')
      setTeam(response.data)
    } catch (err: any) {
      console.error('Failed to fetch team:', err)

      setError(
        err?.response?.data?.detail ||
          'Unable to load your team information.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              Loading team information...
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !team) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
              Team Workspace
            </p>

            <h1 className="mt-2 text-xl font-semibold text-white">
              Unable to load team
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error || 'Team information was not found.'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
            Team Workspace
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
              Team Details
            </h1>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
              <CheckCircle2 size={13} className="text-gray-300" />

              <span className="text-[11px] font-medium text-gray-400">
                Registered
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            View your team registration, roster of members, and credentials.
          </p>
        </div>

        {/* Team overview */}
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Team Profile */}
          <section className="rounded-2xl border border-white/10 bg-[#111827]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Users size={19} className="text-gray-300" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Team Profile
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {team.team_name}
                  </h2>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              <InfoRow
                icon={Hash}
                label="Team ID"
                value={team.team_code}
              />

              <InfoRow
                icon={User}
                label="Team Leader"
                value={team.leader_name}
              />

              <InfoRow
                icon={Mail}
                label="Login Email"
                value={team.leader_email}
              />
            </div>
          </section>

          {/* Team Identity */}
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Team Identity
            </p>

            <div className="mt-6 flex flex-col items-center text-center">
              {team.group_photo_url ? (
                <img
                  src={team.group_photo_url}
                  alt={`${team.team_name} group`}
                  className="h-48 w-48 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#000000]">
                  {team.team_name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}

              <h2 className="mt-5 text-lg font-semibold text-white">
                {team.team_name}
              </h2>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />

                <span className="text-xs text-gray-400">
                  Active Team
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Team Members */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <GraduationCap size={18} className="text-gray-300" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Team Members
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Participant Roster ({team.members?.length || 0} Members)
                </h2>
              </div>
            </div>

            <span className="text-xs font-medium text-[#64748b]">
              4–5 Members per Team
            </span>
          </div>

          <div className="p-6">
            {!team.members || team.members.length === 0 ? (
              <p className="text-sm text-gray-500">
                No members registered yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {team.members.map((member, index) => {
                  const isLeader = member.role?.toLowerCase() === 'leader'

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <div>
                        {/* Card top */}
                        <div className="flex items-center justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-white">
                            #{index + 1}
                          </div>

                          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                            {member.year || '—'}
                          </span>
                        </div>

                        {/* Role */}
                        <div className="mt-3">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                              isLeader
                                ? 'border-white/15 bg-white/[0.05] text-white'
                                : 'border-white/10 text-gray-500'
                            }`}
                          >
                            {isLeader ? 'Leader' : 'Member'}
                          </span>
                        </div>

                        {/* Name */}
                        <h3 className="mt-3 text-base font-semibold text-white">
                          {member.name}
                        </h3>

                        {/* College */}
                        <p className="mt-1 text-xs leading-relaxed text-[#7183a0]">
                          {member.college}
                        </p>

                        {/* Member details */}
                        <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
                          <MemberDetail
                            label="Registration No."
                            value={member.registration_number}
                          />

                          <MemberDetail
                            label="Personal Email"
                            value={member.email}
                            breakText
                          />


                          <MemberDetail
                            label="Academic Year"
                            value={member.year}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Selected problem */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111827]">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <ShieldCheck size={18} className="text-gray-300" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Problem Statement
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Selected Problem
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            {team.selected_problem ? (
              <>
                <p className="text-base font-semibold text-white">
                  {team.selected_problem.title}
                </p>

                <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-500">
                  {team.selected_problem.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
                  <CheckCircle2 size={14} className="text-gray-300" />

                  <span className="text-xs text-gray-400">
                    Problem selected
                  </span>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-300">
                  No problem statement selected
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Select a problem statement from the Problem Statement tab.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

interface InfoRowProps {
  icon: typeof Users
  label: string
  value: string
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-gray-500">
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-600">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-gray-300">
          {value}
        </p>
      </div>
    </div>
  )
}

interface MemberDetailProps {
  label: string
  value: string | null
  breakText?: boolean
}

function MemberDetail({
  label,
  value,
  breakText = false,
}: MemberDetailProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-1 text-xs text-gray-400 ${
          breakText ? 'break-all' : 'truncate'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  )
}