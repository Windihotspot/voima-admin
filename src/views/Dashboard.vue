<template>
  <div class="clients-page">
    <!-- Page Header -->
    <div class="page-header px-6 py-5">
      <div class="d-flex align-start justify-space-between flex-wrap gap-3">
        <div>
          <div class="d-flex align-center gap-2 mb-1">
            <div class="page-icon">
              <font-awesome-icon icon="fa-solid fa-building-user" />
            </div>
            <div>
              <h1 class="text-h5 font-weight-black">Clients</h1>
              <p class="text-medium-emphasis mb-0">Manage the full client lifecycle</p>
            </div>
          </div>
        </div>
        <!-- <div class="d-flex align-center gap-2">
          <v-chip color="primary" variant="tonal" size="small">
            <font-awesome-icon icon="fa-solid fa-circle-dot" class="mr-2 text-success" />
            {{ counts?.total_active_clients ?? 0 }} Active Clients
          </v-chip>
          <v-btn icon size="small" variant="text" :loading="countsLoading" @click="loadCounts">
            <font-awesome-icon icon="fa-solid fa-rotate" />
          </v-btn>
        </div> -->
      </div>

      <!-- Tab bar -->
      <div class="lifecycle-tabs mt-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="lifecycle-tab"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <div class="tab-icon-wrap">
            <font-awesome-icon :icon="tab.icon" />
          </div>
          <div class="tab-content">
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-desc">{{ tab.desc }}</span>
          </div>
          <div class="tab-badge" v-if="tab.badgeCount > 0">{{ tab.badgeCount }}</div>
          <div class="tab-connector" v-if="tab.key !== 'published'" />
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="table-toolbar px-6 py-3 d-flex align-center gap-3 flex-wrap">
      <v-text-field
        v-model="search"
        placeholder="Search by company, email, or reference..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 340px"
        @update:model-value="debouncedLoad"
      >
        <template #prepend-inner>
          <font-awesome-icon icon="fa-solid fa-search" class="text-medium-emphasis" />
        </template>
      </v-text-field>

      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        placeholder="Filter status"
        style="max-width: 200px"
        @update:model-value="loadData"
      >
        <template #prepend-inner>
          <font-awesome-icon icon="fa-solid fa-filter" class="text-medium-emphasis" />
        </template>
      </v-select>

      <v-spacer />

      <span class="text-medium-emphasis">{{ totalCount }} records</span>

      <v-btn variant="tonal" color="primary" size="small" :loading="loading" @click="loadData">
        <font-awesome-icon icon="fa-solid fa-rotate" class="mr-2" />Refresh
      </v-btn>
    </div>

    <v-divider />

    <!-- ═══ WAITLIST TAB ═══════════════════════════ -->
    <template v-if="activeTab === 'waitlist'">
      <v-data-table
        :headers="waitlistHeaders"
        :items="waitlistItems"
        :loading="loading"
        hover
        class="voima-table"
        :items-per-page="perPage"
        hide-default-footer
      >
        <template #item.company_name="{ item }">
          <div class="d-flex align-center gap-3">
            <div class="company-avatar">{{ item.company_name?.charAt(0) }}</div>
            <div>
              <p class="font-weight-semibold mb-0">{{ item.company_name }}</p>
              <p class="text-medium-emphasis mb-0">{{ item.reference_number }}</p>
            </div>
          </div>
        </template>
        <template #item.contact="{ item }">
          <div>
            <p class="mb-0">{{ item.contact_name }}</p>
            <p class="text-medium-emphasis mb-0">{{ item.contact_email }}</p>
          </div>
        </template>
        <template #item.is_regulated="{ item }">
          <v-chip :color="item.is_regulated ? 'primary' : 'grey'" size="x-small" variant="tonal">
            {{ item.is_regulated ? item.regulator_name || 'Regulated' : 'Unregulated' }}
          </v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="statusChipProps(item.status).color"
            size="small"
            variant="flat"
            class="font-weight-medium"
          >
            <font-awesome-icon
              :icon="`fa-solid ${statusChipProps(item.status).icon}`"
              class="mr-1"
            />
            {{ capitalize(item.status) }}
          </v-chip>
        </template>
        <template #item.created_at="{ item }">
          <span class="">{{ fmtDate(item.created_at) }}</span>
        </template>

        <template #no-data>
          <EmptyState
            icon="fa-solid fa-clipboard-list"
            :message="`No ${statusFilter || ''} waitlist entries found`"
          />
        </template>
      </v-data-table>
    </template>

    <!-- ═══ SUBMITTED TAB ══════════════════════════ -->
    <template v-if="activeTab === 'submitted'">
      <v-data-table
        :headers="applicationHeaders"
        :items="applicationItems"
        :loading="loading"
        hover
        class="voima-table"
        :items-per-page="perPage"
        hide-default-footer
      >
        <template #item.company_name="{ item }">
          <div
            class="d-flex align-center gap-3 cursor-pointer"
            @click="openDrawer('application', item.id)"
          >
            <div class="company-avatar">{{ item.company_name?.charAt(0) }}</div>
            <div>
              <p class="font-weight-semibold mb-0 text-primary">
                {{ item.company_name }}
              </p>
              <p class="text-medium-emphasis mb-0">{{ item.reference_number }}</p>
            </div>
          </div>
        </template>
        <template #item.contact="{ item }">
          <div>
            <p class="mb-0">{{ item.contact_full_name }}</p>
            <p class="text-medium-emphasis mb-0">{{ item.contact_email }}</p>
          </div>
        </template>
        <template #item.package="{ item }">
          <v-chip color="primary" size="x-small" variant="tonal">
            {{ item.service_package?.replace(/_/g, ' ') || '—' }}
          </v-chip>
        </template>
        <!-- <template #item.completeness="{ item }">
          <div class="d-flex align-center gap-2">
            <v-chip size="x-small" variant="tonal" color="primary">
              <font-awesome-icon icon="fa-solid fa-users" class="mr-1" />{{ item.director_count }}
            </v-chip>
            <v-chip size="x-small" variant="tonal" color="secondary">
              <font-awesome-icon icon="fa-solid fa-file" class="mr-1" />{{ item.document_count }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="item.declaration_accepted ? 'success' : 'warning'"
              variant="tonal"
            >
              <font-awesome-icon
                :icon="item.declaration_accepted ? 'fa-solid fa-check' : 'fa-solid fa-clock'"
                class="mr-1"
              />
              Decl.
            </v-chip>
          </div>
        </template> -->
        <template #item.status="{ item }">
          <v-chip :color="statusChipProps(item.status).color" size="small" variant="flat">
            <font-awesome-icon
              :icon="`fa-solid ${statusChipProps(item.status).icon}`"
              class="mr-1"
            />
            {{ capitalize(item.status.replace(/_/g, ' ')) }}
          </v-chip>
        </template>
        <template #item.submitted_at="{ item }">
          <span class="">{{ item.submitted_at ? fmtDate(item.submitted_at) : '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="openDrawer('application', item.id)"
            >
              <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />View
            </v-btn>
            <!-- <v-menu>
              <template #activator="{ props: mp }">
                <v-btn size="x-small" variant="text" icon v-bind="mp">
                  <font-awesome-icon icon="fa-solid fa-ellipsis-vertical" />
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-if="['submitted', 'draft'].includes(item.status)"
                  prepend-icon="mdi-check"
                  title="Approve"
                  @click="openReview('approve_app', item)"
                />
                <v-list-item
                  v-if="['submitted', 'draft'].includes(item.status)"
                  title="Request More Info"
                  @click="openReview('request_info', item)"
                >
                  <template #prepend
                    ><font-awesome-icon icon="fa-solid fa-circle-question" class="mr-3"
                  /></template>
                </v-list-item>
                <v-list-item
                  v-if="item.status === 'approved' && !item.converted_client_id"
                  title="Convert to Client"
                  @click="openReview('convert', item)"
                >
                  <template #prepend
                    ><font-awesome-icon icon="fa-solid fa-sync-alt" class="mr-3"
                  /></template>
                </v-list-item>
                <v-divider />
                <v-list-item
                  v-if="['submitted', 'draft'].includes(item.status)"
                  title="Reject"
                  class="text-error"
                  @click="openReview('reject_app', item)"
                >
                  <template #prepend
                    ><font-awesome-icon icon="fa-solid fa-times" class="mr-3 text-error"
                  /></template>
                </v-list-item>
              </v-list>
            </v-menu> -->
          </div>
        </template>
        <template #no-data>
          <EmptyState icon="fa-solid fa-paper-plane" message="No submitted applications found" />
        </template>
      </v-data-table>
    </template>

    <!-- ═══ UNDER REVIEW TAB ═══════════════════════ -->
    <template v-if="activeTab === 'under_review'">
      <v-data-table
        :headers="assessmentHeaders"
        :items="assessmentItems"
        :loading="loading"
        hover
        class="voima-table"
        :items-per-page="perPage"
        hide-default-footer
      >
        <template #item.company_name="{ item }">
          <div
            class="d-flex align-center gap-3 cursor-pointer"
            @click="openDrawer('assessment', item.assessment_id)"
          >
            <div class="company-avatar">{{ item.company_name?.charAt(0) }}</div>
            <div>
              <p class="font-weight-semibold mb-0 text-primary">
                {{ item.company_name }}
              </p>
              <p class="text-medium-emphasis mb-0">{{ item.assessment_ref }}</p>
            </div>
          </div>
        </template>
        <template #item.health_score="{ item }">
          <div class="d-flex align-center gap-2">
            <div class="score-ring" :style="`--score-color: ${scoreColor(item.health_score)}`">
              <span class="score-val">{{ item.health_score?.toFixed(0) ?? '—' }}</span>
            </div>
            <v-chip :color="healthRatingColor(item.health_rating)" size="x-small" variant="tonal">
              {{ item.health_rating || '—' }}
            </v-chip>
          </div>
        </template>
        <template #item.gaps="{ item }">
          <div class="d-flex align-center gap-1">
            <v-chip v-if="item.critical_gaps > 0" size="x-small" color="error" variant="flat">
              <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-1" />{{
                item.critical_gaps
              }}
            </v-chip>
            <span class="text-medium-emphasis">{{ item.total_gaps }} total</span>
          </div>
        </template>
        <template #item.open_actions="{ item }">
          <v-chip
            :color="item.open_actions > 0 ? 'warning' : 'success'"
            size="x-small"
            variant="tonal"
          >
            {{ item.open_actions }} open
          </v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="statusChipProps(item.assessment_status).color"
            size="small"
            variant="flat"
          >
            <font-awesome-icon
              :icon="`fa-solid ${statusChipProps(item.assessment_status).icon}`"
              class="mr-1"
            />
            {{ capitalize(item.assessment_status?.replace(/_/g, ' ')) }}
          </v-chip>
        </template>
        <template #item.completed_at="{ item }">
          <span class="">{{ item.completed_at ? fmtDate(item.completed_at) : '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="openDrawer('assessment', item.assessment_id)"
            >
              <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />Review
            </v-btn>
            <v-btn
              v-if="item.assessment_status === 'under_review'"
              size="x-small"
              color="success"
              variant="tonal"
              @click="openReview('publish', item)"
            >
              <font-awesome-icon icon="fa-solid fa-globe" class="mr-1" />Publish
            </v-btn>
            <v-btn
              v-if="item.assessment_status === 'completed'"
              size="x-small"
              color="warning"
              variant="tonal"
              @click="openReview('flag_review', item)"
            >
              <font-awesome-icon icon="fa-solid fa-flag" class="mr-1" />Flag
            </v-btn>
          </div>
        </template>
        <template #no-data>
          <EmptyState icon="fa-solid fa-magnifying-glass" message="No assessments under review" />
        </template>
      </v-data-table>
    </template>

    <!-- ═══ PUBLISHED TAB ══════════════════════════ -->
    <template v-if="activeTab === 'published'">
      <v-data-table
        :headers="publishedHeaders"
        :items="assessmentItems"
        :loading="loading"
        hover
        class="voima-table"
        :items-per-page="perPage"
        hide-default-footer
      >
        <template #item.company_name="{ item }">
          <div
            class="d-flex align-center gap-3 cursor-pointer"
            @click="openDrawer('assessment', item.assessment_id)"
          >
            <div class="company-avatar published">{{ item.company_name?.charAt(0) }}</div>
            <div>
              <p class="font-weight-semibold mb-0 text-primary">
                {{ item.company_name }}
              </p>
              <p class="text-medium-emphasis mb-0">{{ item.assessment_ref }}</p>
            </div>
          </div>
        </template>
        <template #item.health_score="{ item }">
          <div class="d-flex align-center gap-2">
            <div class="score-ring" :style="`--score-color: ${scoreColor(item.health_score)}`">
              <span class="score-val">{{ item.health_score?.toFixed(0) ?? '—' }}</span>
            </div>
            <v-chip :color="healthRatingColor(item.health_rating)" size="x-small" variant="tonal">
              {{ item.health_rating || '—' }}
            </v-chip>
          </div>
        </template>
        <template #item.gaps_summary="{ item }">
          <div class="d-flex align-center gap-1 flex-wrap">
            <v-chip v-if="item.critical_gaps > 0" size="x-small" color="error" variant="flat">
              <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-1" />{{
                item.critical_gaps
              }}
              critical
            </v-chip>
            <v-chip
              size="x-small"
              :color="item.open_gaps === 0 ? 'success' : 'warning'"
              variant="tonal"
            >
              {{ item.open_gaps }} open
            </v-chip>
            <span class="text-medium-emphasis">/ {{ item.total_gaps }}</span>
          </div>
        </template>
        <template #item.open_actions="{ item }">
          <v-chip
            :color="item.open_actions > 0 ? 'warning' : 'success'"
            size="x-small"
            variant="flat"
          >
            {{ item.open_actions }} pending
          </v-chip>
        </template>
        <template #item.reviewer="{ item }">
          <span class="">{{ item.reviewer_name || '—' }}</span>
        </template>
        <template #item.reviewed_at="{ item }">
          <span class="">{{ item.reviewed_at ? fmtDate(item.reviewed_at) : '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="x-small"
            variant="tonal"
            color="primary"
            @click="openDrawer('assessment', item.assessment_id)"
          >
            <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />View Report
          </v-btn>
        </template>
        <template #no-data>
          <EmptyState icon="fa-solid fa-globe" message="No published assessments yet" />
        </template>
      </v-data-table>
    </template>

    <!-- Pagination -->
    <div class="px-4 py-3 d-flex align-center justify-space-between">
      <span class="text-medium-emphasis">
        Showing {{ Math.min((page - 1) * perPage + 1, totalCount) }}–{{
          Math.min(page * perPage, totalCount)
        }}
        of {{ totalCount }}
      </span>
      <v-pagination
        v-model="page"
        :length="pageCount"
        density="compact"
        :total-visible="5"
        @update:model-value="loadData"
      />
    </div>

    <!-- ── DETAIL DRAWER ── -->
    <ClientDetailDrawer v-model="drawerOpen" :mode="drawerMode" :item-id="drawerItemId">
      <template #actions>
        <template v-if="drawerMode === 'application' && drawerItemId">
          <v-btn
            color="success"
            variant="tonal"
            size="small"
            @click="openReview('approve_app', { id: drawerItemId, company_name: 'this company' })"
          >
            <font-awesome-icon icon="fa-solid fa-check" class="mr-2" />Approve Application
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            @click="openReview('convert', { id: drawerItemId, company_name: 'this company' })"
          >
            <font-awesome-icon icon="fa-solid fa-sync-alt" class="mr-2" />Convert to Client
          </v-btn>
        </template>
        <!-- Assessment actions are now handled inside AssessmentReviewPanel -->
      </template>
    </ClientDetailDrawer>

    <AdminReviewDialog
      v-if="reviewDialog.open"
      v-model="reviewDialog.open"
      :action="reviewDialog.action"
      :company-name="reviewDialog.companyName"
      :ref-number="reviewDialog.refNumber"
      :extra-info="reviewDialog.extraInfo"
      :consultants="consultants"
      :loading="reviewDialog.loading"
      @confirm="handleReviewConfirm"
    />

    <!-- ── ASSESSMENT REVIEW PANEL ── -->
    <AssessmentReviewPanel
      v-model="reviewPanelOpen"
      :assessment-id="reviewPanelAssessmentId"
      @published="handlePublished"
      @updated="loadData"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      <font-awesome-icon
        :icon="
          snack.color === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-circle-exclamation'
        "
        class="mr-2"
      />
      {{ snack.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClients } from '@/composables/useClients'
import ClientDetailDrawer from '@/components/clients/ClientsDetailDrawer.vue'
import AdminReviewDialog from '@/components/clients/AdminReviewDialog.vue'
import AssessmentReviewPanel from '@/components/clients/AssessmentReviewPanel.vue'

// ── tiny local empty state ──────────────────────────────
const EmptyState = {
  props: ['icon', 'message'],
  template: `
    <div class="text-center py-16 opacity-60">
      <font-awesome-icon :icon="icon" style="font-size:2.5rem;color:#ccc" class="mb-4 d-block mx-auto"/>
      <p style="font-size:.875rem;color:#999">{{ message }}</p>
    </div>
  `
}

const {
  loading,
  fetchWaitlist,
  reviewWaitlistEntry,
  fetchApplications,
  reviewApplication,
  convertToClient,
  fetchAssessments,
  publishAssessment,
  updateAssessmentStatus,
  fetchPageCounts,
  healthRatingColor,
  statusChipProps
} = useClients()

// ── State ────────────────────────────────────────────────
const activeTab = ref<'waitlist' | 'submitted' | 'under_review' | 'published'>('waitlist')
const search = ref('')
const statusFilter = ref<string | null>(null)
const page = ref(1)
const perPage = 20
const totalCount = ref(0)
const counts = ref<any>(null)
const countsLoading = ref(false)

const waitlistItems = ref<any[]>([])
const applicationItems = ref<any[]>([])
const assessmentItems = ref<any[]>([])

const consultants = ref<{ id: string; full_name: string }[]>([])

const drawerOpen = ref(false)
const drawerMode = ref<'application' | 'assessment'>('application')
const drawerItemId = ref<string | null>(null)
const reviewPanelOpen = ref(false)
const reviewPanelAssessmentId = ref<string | null>(null)

const reviewDialog = ref({
  open: false,
  action: 'approve_waitlist' as any,
  companyName: '',
  refNumber: '',
  extraInfo: '',
  itemId: '',
  assessmentId: '',
  loading: false
})

const snack = ref({ show: false, message: '', color: 'success' })

// ── Tabs config ──────────────────────────────────────────
const tabs = computed(() => [
  {
    key: 'waitlist',
    label: 'Waitlist',
    desc: 'Interest registrations',
    icon: 'fa-solid fa-clipboard-list',
    badgeCount: counts.value?.waitlist_pending ?? 0
  },
  {
    key: 'submitted',
    label: 'Submitted',
    desc: 'Onboarding applications',
    icon: 'fa-solid fa-paper-plane',
    badgeCount: (counts.value?.onboarding_submitted ?? 0) + (counts.value?.onboarding_draft ?? 0)
  },
  {
    key: 'under_review',
    label: 'Under Review',
    desc: 'Assessment being reviewed',
    icon: 'fa-solid fa-magnifying-glass',
    badgeCount: counts.value?.assessment_under_review ?? 0
  },
  {
    key: 'published',
    label: 'Published',
    desc: 'Gap analysis released',
    icon: 'fa-solid fa-globe',
    badgeCount: counts.value?.assessment_published ?? 0
  }
])

const pageCount = computed(() => Math.ceil(totalCount.value / perPage))

// ── Status options per tab ────────────────────────────────
const statusOptions = computed(() => {
  if (activeTab.value === 'waitlist') {
    return [
      { label: 'Pending', value: 'pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
      { label: 'Converted', value: 'converted' }
    ]
  }
  if (activeTab.value === 'submitted') {
    return [
      { label: 'Draft', value: 'draft' },
      { label: 'Submitted', value: 'submitted' },
      { label: 'Approved', value: 'approved' },
      { label: 'Info Requested', value: 'info_requested' },
      { label: 'Rejected', value: 'rejected' }
    ]
  }
  return [
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Published', value: 'published' }
  ]
})

// ── Table headers ─────────────────────────────────────────
const waitlistHeaders = [
  { title: 'Company', key: 'company_name', sortable: true, width: 220 },
  { title: 'Contact', key: 'contact', sortable: false, width: 200 },
  { title: 'Regulatory', key: 'is_regulated', sortable: false, width: 150 },
  { title: 'Status', key: 'status', sortable: true, width: 130 },
  { title: 'Registered', key: 'created_at', sortable: true, width: 130 }
]

const applicationHeaders = [
  { title: 'Company', key: 'company_name', sortable: true, width: 220 },
  { title: 'Contact', key: 'contact', sortable: false, width: 180 },
  { title: 'Status', key: 'status', sortable: true, width: 140 },
  { title: 'Submitted', key: 'submitted_at', sortable: true, width: 120 },
  { title: 'Actions', key: 'actions', sortable: false, width: 160 }
]

const assessmentHeaders = [
  { title: 'Client', key: 'company_name', sortable: true, width: 220 },
  { title: 'Health Score', key: 'health_score', sortable: true, width: 180 },
  { title: 'Gaps', key: 'gaps', sortable: false, width: 150 },
  { title: 'Open Actions', key: 'open_actions', sortable: false, width: 130 },
  { title: 'Status', key: 'status', sortable: true, width: 130 },
  { title: 'Completed', key: 'completed_at', sortable: true, width: 120 },
  { title: '', key: 'actions', sortable: false, width: 180 }
]

const publishedHeaders = [
  { title: 'Client', key: 'company_name', sortable: true, width: 220 },
  { title: 'Health Score', key: 'health_score', sortable: true, width: 180 },
  { title: 'Gaps', key: 'gaps_summary', sortable: false, width: 200 },
  { title: 'Actions', key: 'open_actions', sortable: false, width: 130 },
  { title: 'Reviewed By', key: 'reviewer', sortable: false, width: 140 },
  { title: 'Published', key: 'reviewed_at', sortable: true, width: 120 },
  { title: '', key: 'actions', sortable: false, width: 140 }
]

// ── Data loading ──────────────────────────────────────────
async function loadData() {
  const offset = (page.value - 1) * perPage
  const params = {
    status: statusFilter.value ?? undefined,
    search: search.value || undefined,
    limit: perPage,
    offset
  }

  if (activeTab.value === 'waitlist') {
    const data = await fetchWaitlist(params)
    waitlistItems.value = data
    totalCount.value = data[0]?.total_count ?? 0
  } else if (activeTab.value === 'submitted') {
    const data = await fetchApplications(params)
    applicationItems.value = data
    totalCount.value = data[0]?.total_count ?? 0
  } else if (activeTab.value === 'under_review') {
    const data = await fetchAssessments({
      ...params,
      status: params.status ?? undefined // remove the hardcoded status
    })
    assessmentItems.value = data
    totalCount.value = data[0]?.total_count ?? 0
  } else if (activeTab.value === 'published') {
    const data = await fetchAssessments({ ...params, status: params.status ?? 'published' })
    assessmentItems.value = data
    totalCount.value = data[0]?.total_count ?? 0
  }
}

async function loadCounts() {
  countsLoading.value = true
  try {
    counts.value = await fetchPageCounts()
  } finally {
    countsLoading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadData, 350)
}

function switchTab(key: string) {
  activeTab.value = key as any
  page.value = 1
  statusFilter.value = null
  loadData()
}

// ── Drawer ────────────────────────────────────────────────
function openDrawer(mode: 'application' | 'assessment', id: string) {
  if (mode === 'assessment') {
    // Under Review + Published: open full review panel
    reviewPanelAssessmentId.value = id
    reviewPanelOpen.value = true
  } else {
    // Application: keep original drawer
    drawerMode.value = mode
    drawerItemId.value = id
    drawerOpen.value = true
  }
}

async function handlePublished() {
  showSnack('Assessment published and client notified', 'success')
  reviewPanelOpen.value = false
  await loadData()
  await loadCounts()
}

// ── Review dialog ──────────────────────────────────────────
function openReview(action: string, item: any) {
  reviewDialog.value = {
    open: true,
    action: action as any,
    companyName: item.company_name || '—',
    refNumber: item.reference_number || item.assessment_ref || '',
    extraInfo: item.service_package || item.entity_category || '',
    itemId: item.id || '',
    assessmentId: item.assessment_id || '',
    loading: false
  }
}

async function handleReviewConfirm(payload: {
  notes: string
  consultantId?: string
  rmId?: string
  startDate?: string
}) {
  reviewDialog.value.loading = true
  try {
    const { action, itemId, assessmentId } = reviewDialog.value

    if (action === 'approve_waitlist') {
      await reviewWaitlistEntry(itemId, 'approve', payload.notes)
    } else if (action === 'reject_waitlist') {
      await reviewWaitlistEntry(itemId, 'reject', payload.notes)
    } else if (action === 'approve_app') {
      await reviewApplication(itemId, 'approve', payload.notes)
    } else if (action === 'reject_app') {
      await reviewApplication(itemId, 'reject', payload.notes)
    } else if (action === 'request_info') {
      await reviewApplication(itemId, 'request_info', payload.notes)
    } else if (action === 'convert') {
      await convertToClient(itemId, payload.consultantId, payload.rmId, payload.startDate)
    } else if (action === 'publish') {
      await publishAssessment(assessmentId || itemId, payload.notes)
    } else if (action === 'flag_review') {
      await updateAssessmentStatus(assessmentId || itemId, 'under_review', payload.notes)
    }

    showSnack('Action completed successfully', 'success')
    reviewDialog.value.open = false
    await loadData()
    await loadCounts()
  } catch (e: any) {
    showSnack(e.message || 'Something went wrong', 'error')
  } finally {
    reviewDialog.value.loading = false
  }
}

// ── Helpers ───────────────────────────────────────────────
function showSnack(message: string, color: 'success' | 'error') {
  snack.value = { show: true, message, color }
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function capitalize(str: string) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function scoreColor(score: number | null) {
  if (score == null) return '#9E9E9E'
  if (score >= 80) return '#43A047'
  if (score >= 60) return '#FB8C00'
  if (score >= 40) return '#E53935'
  return '#B71C1C'
}

// ── Init ──────────────────────────────────────────────────
onMounted(() => {
  loadCounts()
  loadData()
})
</script>

<style scoped>
.clients-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* ── Header ── */
.page-header {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.15);
}
.page-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #4a2c8f 100%);
  color: white;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* ── Lifecycle tabs ── */
.lifecycle-tabs {
  display: flex;
  gap: 4;
  background: #c8d2f5;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 14px;
  padding: 4px;
  width: fit-content;
  position: relative;
}

.lifecycle-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.lifecycle-tab:hover {
  margin: 5px;
  background: rgba(var(--v-theme-surface), 0.8);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.lifecycle-tab.active {
  margin: 5px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.tab-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.lifecycle-tab.active .tab-icon-wrap {
  background: rgba(var(--v-theme-primary), 0.15);
}

.tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.tab-label {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}
.tab-desc {
  font-size: 0.65rem;
  opacity: 0.7;
  white-space: nowrap;
}

.tab-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: rgb(var(--v-theme-error));
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  padding: 0 5px;
  flex-shrink: 0;
}

/* .tab-connector {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 2px;
  background: rgba(var(--v-theme-primary), 0.3);
  z-index: 1;
} */

/* ── Toolbar ── */
.table-toolbar {
  background: rgb(var(--v-theme-surface));
}

/* ── Table ── */
.voima-table :deep(.v-data-table__thead) {
  background: rgba(var(--v-theme-surface-variant), 0.5) !important;
}
.voima-table :deep(th) {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: rgba(var(--v-theme-on-surface), 0.55) !important;
}
.voima-table :deep(tr:hover td) {
  background: rgba(var(--v-theme-primary), 0.02) !important;
}
.voima-table :deep(.v-data-table__tr--hover) {
  cursor: pointer;
}

/* ── Company avatar ── */
.company-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.15) 0%,
    rgba(var(--v-theme-primary), 0.25) 100%
  );
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
.company-avatar.published {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
  border-color: #86efac;
}

/* ── Score ring ── */
.score-ring {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2.5px solid var(--score-color);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.score-val {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--score-color);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
