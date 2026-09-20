import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Lock,
  MessageSquare,
  Send,
  Star,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import WorkspaceCard from '../../components/ui/WorkspaceCard'
import api from '../../services/api'

interface FeatureStatus {
  repository_active: boolean
  feedback_active: boolean
  server_time: string
}

interface RepositoryData {
  repository_url: string | null
  repository_submitted_at: string | null
}

interface FeedbackData {
  id: number
  team_id: number
  rating: number
  comments: string
  created_at: string
  updated_at: string
}

export default function RepositoryFeedback() {
  const [features, setFeatures] = useState<FeatureStatus>({
    repository_active: false,
    feedback_active: false,
    server_time: '',
  })

  // Repository state
  const [repoUrl, setRepoUrl] = useState('')
  const [currentRepo, setCurrentRepo] = useState<RepositoryData>({
    repository_url: null,
    repository_submitted_at: null,
  })
  const [repoSubmitting, setRepoSubmitting] = useState(false)
  const [repoSuccess, setRepoSuccess] = useState('')
  const [repoError, setRepoError] = useState('')

  // Feedback state
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comments, setComments] = useState('')
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [featuresRes, repoRes, feedbackRes] = await Promise.all([
        api.get<FeatureStatus>('/features/status'),
        api.get<RepositoryData>('/teams/me/repository'),
        api.get<FeedbackData | null>('/teams/me/feedback'),
      ])

      setFeatures(featuresRes.data)
      setCurrentRepo(repoRes.data)
      if (repoRes.data.repository_url) {
        setRepoUrl(repoRes.data.repository_url)
      }

      if (feedbackRes.data) {
        setCurrentFeedback(feedbackRes.data)
        setRating(feedbackRes.data.rating)
        setComments(feedbackRes.data.comments)
      }
    } catch (err: any) {
      console.error('Failed to load repository & feedback data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle Repository submission
  const handleRepositorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRepoError('')
    setRepoSuccess('')

    const trimmedUrl = repoUrl.trim()
    if (!trimmedUrl) {
      setRepoError('Please enter a valid repository URL.')
      return
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setRepoError('Repository URL must begin with http:// or https://')
      return
    }

    try {
      setRepoSubmitting(true)
      const response = await api.post<RepositoryData>('/teams/me/repository', {
        repository_url: trimmedUrl,
      })

      setCurrentRepo(response.data)
      setRepoSuccess('Repository URL submitted successfully!')
    } catch (err: any) {
      setRepoError(
        err?.response?.data?.detail || 'Failed to submit repository URL.',
      )
    } finally {
      setRepoSubmitting(false)
    }
  }

  // Handle Feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackError('')
    setFeedbackSuccess('')

    const trimmedComments = comments.trim()
    if (trimmedComments.length < 3) {
      setFeedbackError('Please provide at least a short comment.')
      return
    }

    try {
      setFeedbackSubmitting(true)
      const response = await api.post<FeedbackData>('/teams/me/feedback', {
        rating,
        comments: trimmedComments,
      })

      setCurrentFeedback(response.data)
      setFeedbackSuccess('Thank you! Your feedback has been submitted successfully.')
    } catch (err: any) {
      setFeedbackError(
        err?.response?.data?.detail || 'Failed to submit feedback.',
      )
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              Loading repository & feedback settings...
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#61718b]">
            Team Workspace
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Repository & Feedback
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7183a0]">
            Submit your project repository link and share your hackathon experience when activated by organizers.
          </p>
        </div>

        {/* TWO-COLUMN WORKSPACE GRID */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ========================================================= */}
          {/* 1. REPOSITORY SUBMISSION SECTION */}
          {/* ========================================================= */}
          <WorkspaceCard className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-gray-300">
                    <GitBranch size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#64748b]">
                      Project Deliverable
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-white">
                      Repository Submission
                    </h2>
                  </div>
                </div>

                {/* Status Indicator */}
                {features.repository_active ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
                    <Lock size={12} className="text-gray-500" />
                    Not Activated
                  </div>
                )}
              </div>

              {/* Description / Alerts */}
              <p className="mt-5 text-sm leading-6 text-[#7183a0]">
                Submit your public GitHub or Git repository link containing your code, README, and project assets for evaluation.
              </p>

              {repoError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{repoError}</span>
                </div>
              )}

              {repoSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>{repoSuccess}</span>
                </div>
              )}

              {/* Form or Inactive Notice */}
              {features.repository_active ? (
                <form onSubmit={handleRepositorySubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="repo-url"
                      className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                    >
                      GitHub Repository URL
                    </label>

                    <input
                      id="repo-url"
                      type="url"
                      placeholder="https://github.com/organization/project-name"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={repoSubmitting}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#000000] transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    {repoSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        {currentRepo.repository_url ? 'Update Repository' : 'Submit Repository'}
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
                  <Lock size={20} className="mx-auto text-gray-500" />
                  <p className="mt-2 text-sm font-medium text-gray-300">
                    Repository submission is currently unavailable
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    The organizers have not yet opened code submissions. You will be able to submit your link once activated.
                  </p>
                </div>
              )}
            </div>

            {/* Current Submission Display */}
            {currentRepo.repository_url && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submitted Repository
                </p>

                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
                  <a
                    href={currentRepo.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-white hover:underline"
                  >
                    {currentRepo.repository_url}
                  </a>

                  <a
                    href={currentRepo.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-gray-400 hover:text-white"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                {currentRepo.repository_submitted_at && (
                  <p className="mt-2 text-[11px] text-gray-500">
                    Last updated: {new Date(currentRepo.repository_submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </WorkspaceCard>

          {/* ========================================================= */}
          {/* 2. FEEDBACK SUBMISSION SECTION */}
          {/* ========================================================= */}
          <WorkspaceCard className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-gray-300">
                    <MessageSquare size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#64748b]">
                      Participant Voice
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-white">
                      Hackathon Feedback
                    </h2>
                  </div>
                </div>

                {/* Status Indicator */}
                {features.feedback_active ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
                    <Lock size={12} className="text-gray-500" />
                    Not Activated
                  </div>
                )}
              </div>

              {/* Description / Alerts */}
              <p className="mt-5 text-sm leading-6 text-[#7183a0]">
                Rate your overall hackathon experience and share suggestions with the organizing committee.
              </p>

              {feedbackError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {feedbackSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {/* Form or Inactive Notice */}
              {features.feedback_active ? (
                <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-5">
                  {/* Rating Stars */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
                      Overall Experience Rating
                    </label>

                    <div className="mt-2.5 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled =
                          (hoverRating !== null ? hoverRating : rating) >= star

                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="rounded-lg p-1 text-gray-600 transition-colors hover:text-amber-400 focus:outline-none"
                          >
                            <Star
                              size={26}
                              className={
                                isFilled
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-600'
                              }
                            />
                          </button>
                        )
                      })}

                      <span className="ml-2 text-sm font-medium text-gray-300">
                        {rating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Comments Textarea */}
                  <div>
                    <label
                      htmlFor="feedback-comments"
                      className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                    >
                      Comments & Suggestions
                    </label>

                    <textarea
                      id="feedback-comments"
                      rows={4}
                      placeholder="Share your thoughts on the problem statements, mentorship, platform, or organization..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      required
                      className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#000000] transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    {feedbackSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        {currentFeedback ? 'Update Feedback' : 'Submit Feedback'}
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
                  <Lock size={20} className="mx-auto text-gray-500" />
                  <p className="mt-2 text-sm font-medium text-gray-300">
                    Feedback submission is currently unavailable
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Feedback opens toward the end of the event. Please check back later.
                  </p>
                </div>
              )}
            </div>

            {/* Current Feedback Display if submitted */}
            {currentFeedback && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Previously Submitted Feedback
                </p>

                <div className="mt-2 rounded-xl border border-white/10 bg-[#111827] p-4">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={
                          star <= currentFeedback.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-700'
                        }
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-400">
                      ({currentFeedback.rating}/5 stars)
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-300">
                    "{currentFeedback.comments}"
                  </p>

                  <p className="mt-2 text-[11px] text-gray-500">
                    Submitted: {new Date(currentFeedback.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </WorkspaceCard>
        </div>
      </div>
    </DashboardLayout>
  )
}
