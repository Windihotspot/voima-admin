// composables/useClients.ts
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface WaitlistEntry {
  id: string
  reference_number: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  nature_of_business: string
  is_regulated: boolean
  regulator_name: string | null
  service_package: string | null
  description_of_needs: string | null
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'converted'
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  converted_client_id: string | null
  created_at: string
  total_count: number
}

export interface OnboardingApplication {
  id: string
  reference_number: string
  company_name: string
  trading_name: string | null
  organisation_type: string
  registration_number: string | null
  contact_full_name: string | null
  contact_email: string | null
  contact_phone: string | null
  service_package: string | null
  status: string
  submitted_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  converted_client_id: string | null
  declaration_accepted: boolean
  director_count: number
  document_count: number
  created_at: string
  total_count: number
}

export interface AssessmentSummary {
  assessment_id: string
  assessment_ref: string
  assessment_status: string
  health_score: number | null
  health_rating: string | null
  entity_category: string
  client_id: string
  company_name: string
  primary_contact_email: string | null
  engagement_id: string | null
  service_package: string | null
  open_gaps: number
  critical_gaps: number
  total_gaps: number
  open_actions: number
  started_at: string | null
  completed_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  created_at: string
  total_count: number
}

export interface PageCounts {
  waitlist_pending: number
  waitlist_approved: number
  onboarding_draft: number
  onboarding_submitted: number
  onboarding_approved: number
  assessment_under_review: number
  assessment_published: number
  total_active_clients: number
}

// ─────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────
export function useClients() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Waitlist ──────────────────────────────
  async function fetchWaitlist(
    params: {
      status?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_waitlist_entries', {
        p_status: params.status ?? null,
        p_search: params.search ?? null,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0
      })
      if (err) throw err
      return data as WaitlistEntry[]
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function reviewWaitlistEntry(id: string, action: 'approve' | 'reject', notes?: string) {
    const { data, error: err } = await supabase.rpc('review_waitlist_entry', {
      p_waitlist_id: id,
      p_action: action,
      p_review_notes: notes ?? null
    })
    if (err) throw err
    return data
  }

  // ── Onboarding Applications ───────────────
  async function fetchApplications(
    params: {
      status?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_onboarding_applications', {
        p_status: params.status ?? null,
        p_search: params.search ?? null,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0
      })
      if (err) throw err
      return data as OnboardingApplication[]
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchApplicationDetail(applicationId: string) {
    const { data, error: err } = await supabase.rpc('get_application_detail', {
      p_application_id: applicationId
    })
    if (err) throw err
    return data
  }

  async function reviewApplication(
    id: string,
    action: 'approve' | 'reject' | 'request_info',
    notes?: string
  ) {
    const { data, error: err } = await supabase.rpc('review_onboarding_application', {
      p_application_id: id,
      p_action: action,
      p_review_notes: notes ?? null
    })
    if (err) throw err
    return data
  }

  async function convertToClient(
    applicationId: string,
    consultantId?: string,
    rmId?: string,
    startDate?: string
  ) {
    const { data, error: err } = await supabase.rpc('convert_application_to_client', {
      p_application_id: applicationId,
      p_assigned_consultant_id: consultantId ?? null,
      p_assigned_rm_id: rmId ?? null,
      p_start_date: startDate ?? new Date().toISOString().split('T')[0]
    })
    if (err) throw err
    return data
  }

  // ── Assessments ───────────────────────────
  async function fetchAssessments(
    params: {
      status?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('get_assessments_summary', {
        p_status: params.status ?? null,
        p_search: params.search ?? null,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0
      })
      if (err) throw err
      return data as AssessmentSummary[]
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAssessmentDetail(assessmentId: string) {
    const { data, error: err } = await supabase.rpc('get_assessment_detail', {
      p_assessment_id: assessmentId
    })
    if (err) throw err
    return data
  }

  async function publishAssessment(assessmentId: string, notes?: string) {
    const { data, error: err } = await supabase.rpc('publish_assessment', {
      p_assessment_id: assessmentId,
      p_review_notes: notes ?? null
    })
    if (err) throw err
    return data
  }

  async function updateAssessmentStatus(assessmentId: string, status: string, notes?: string) {
    const { data, error: err } = await supabase.rpc('update_assessment_status', {
      p_assessment_id: assessmentId,
      p_status: status,
      p_review_notes: notes ?? null
    })
    if (err) throw err
    return data
  }

  // ── Page counts (tab badges) ──────────────
  async function fetchPageCounts() {
    const { data, error: err } = await supabase.rpc('get_clients_page_counts')
    console.log('clients page count:', data)
    if (err) throw err
    console.log('clients page count error:', err)
    return data as PageCounts
  }

  // ── Helpers ───────────────────────────────
  const healthRatingColor = (rating: string | null) => {
    if (!rating) return 'grey'
    const map: Record<string, string> = {
      excellent: 'success',
      good: 'light-green',
      fair: 'warning',
      poor: 'error',
      critical: 'deep-orange'
    }
    return map[rating.toLowerCase()] ?? 'grey'
  }

  const riskRatingColor = (rating: string | null) => {
    const map: Record<string, string> = {
      critical: '#B71C1C',
      high: '#E53935',
      medium: '#FB8C00',
      low: '#43A047'
    }
    return map[rating?.toLowerCase() ?? ''] ?? '#9E9E9E'
  }

  const statusChipProps = (status: string) => {
    const map: Record<string, { color: string; icon: string }> = {
      // waitlist
      pending: { color: 'orange-lighten-4', icon: 'fa-clock' },
      approved: { color: 'green-lighten-4', icon: 'fa-check-circle' },
      rejected: { color: 'red-lighten-4', icon: 'fa-times-circle' },
      converted: { color: 'purple-lighten-4', icon: 'fa-sync-alt' },
      // onboarding
      draft: { color: 'grey-lighten-3', icon: 'fa-file' },
      submitted: { color: 'blue-lighten-4', icon: 'fa-paper-plane' },
      info_requested: { color: 'amber-lighten-4', icon: 'fa-exclamation-circle' },
      // assessment
      not_started: { color: 'grey-lighten-3', icon: 'fa-circle' },
      in_progress: { color: 'blue-lighten-4', icon: 'fa-spinner' },
      completed: { color: 'cyan-lighten-4', icon: 'fa-check' },
      under_review: { color: 'amber-lighten-4', icon: 'fa-search' },
      published: { color: 'green-lighten-4', icon: 'fa-globe' },
      archived: { color: 'grey-lighten-3', icon: 'fa-archive' }
    }
    return map[status?.toLowerCase()] ?? { color: 'grey-lighten-3', icon: 'fa-question-circle' }
  }

  return {
    loading,
    error,
    // waitlist
    fetchWaitlist,
    reviewWaitlistEntry,
    // applications
    fetchApplications,
    fetchApplicationDetail,
    reviewApplication,
    convertToClient,
    // assessments
    fetchAssessments,
    fetchAssessmentDetail,
    publishAssessment,
    updateAssessmentStatus,
    // page
    fetchPageCounts,
    // helpers
    healthRatingColor,
    riskRatingColor,
    statusChipProps
  }
}
