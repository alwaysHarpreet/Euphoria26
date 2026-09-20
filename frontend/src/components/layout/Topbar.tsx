import { useEffect, useState } from 'react'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface TeamProfile {
  team_name: string
  group_photo_path?: string | null
  group_photo_url?: string | null
}

export default function Topbar() {
  const { role } = useAuth()

  const [team, setTeam] = useState<TeamProfile | null>(null)

  useEffect(() => {
    if (role !== 'team') {
      return
    }

    api.get<TeamProfile>('/teams/me')
      .then((response) => {
        setTeam(response.data)
      })
      .catch(() => {
        setTeam(null)
      })
  }, [role])

  const photoUrl =
    team?.group_photo_url ||
    (team?.group_photo_path
      ? `${api.defaults.baseURL?.replace(/\/$/, '')}/uploads/${team.group_photo_path}`
      : null)

  return (
    <header className="flex h-[76px] items-center justify-end border-b border-white/10 bg-[#0b0f19] px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">
            {team?.team_name || 'Team Leader'}
          </p>

          <p className="text-[11px] text-gray-500">
            Team Account
          </p>
        </div>

        {photoUrl ? (
          <img
            src={photoUrl}
            alt={team?.team_name || 'Team'}
            className="h-11 w-11 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white text-sm font-bold text-[#0b0f19]">
            {team?.team_name?.charAt(0).toUpperCase() || 'T'}
          </div>
        )}
      </div>
    </header>
  )
}