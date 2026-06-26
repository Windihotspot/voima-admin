<template>
  <v-navigation-drawer
    v-model="dialogOpen"
    location="right"
    :width="620"
    temporary
    class="client-detail-drawer m-4"
  >
    <!-- Header -->
    <div class="drawer-header px-6 py-4 d-flex align-center justify-space-between">
      <div>
        <p class="text-caption text-medium-emphasis mb-1 text-uppercase tracking-wide">
          {{ headerLabel }}
        </p>
        <h3 class="text-h6 font-weight-bold text-white">{{ title }}</h3>
        <p v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</p>
      </div>
      <v-btn icon variant="text" color="white" @click="$emit('update:modelValue', false)">
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center align-center py-16">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <template v-else-if="detail">
      <!-- ── APPLICATION DETAIL ────────────────── -->
      <template v-if="mode === 'application'">
        <v-tabs v-model="activeTab" color="primary" density="compact" class="px-4 pt-2">
          <v-tab value="overview"
            ><font-awesome-icon icon="fa-solid fa-building" class="mr-2" />Overview</v-tab
          >
          <v-tab value="directors"
            ><font-awesome-icon icon="fa-solid fa-users" class="mr-2" />Directors</v-tab
          >
          <v-tab value="documents"
            ><font-awesome-icon icon="fa-solid fa-file" class="mr-2" />Documents</v-tab
          >
        </v-tabs>
        <v-divider />

        <v-tabs-window v-model="activeTab" class="pa-5">
          <!-- Overview -->
          <v-tabs-window-item value="overview" class="ma-4">
            <div class="detail-section">
              <p class="section-label">Company Information</p>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-key">Legal Name</span>
                  <span class="detail-val">{{ detail.application?.company_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Trading Name</span>
                  <span class="detail-val">{{ detail.application?.trading_name || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Organisation Type</span>
                  <span class="detail-val capitalize">{{
                    detail.application?.organisation_type?.replace(/_/g, ' ')
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Reg. Number</span>
                  <span class="detail-val">{{
                    detail.application?.registration_number || '—'
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Country</span>
                  <span class="detail-val">{{ detail.application?.country }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Website</span>
                  <span class="detail-val">{{ detail.application?.website || '—' }}</span>
                </div>
                <div class="detail-item" v-if="detail.application?.is_regulated">
                  <span class="detail-key">Regulator</span>
                  <span class="detail-val">{{ detail.application?.regulator_name }}</span>
                </div>
                <div class="detail-item" v-if="detail.application?.is_regulated">
                  <span class="detail-key">License No.</span>
                  <span class="detail-val">{{
                    detail.application?.regulatory_license_number || '—'
                  }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section mt-4">
              <p class="section-label">Primary Contact</p>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-key">Name</span>
                  <span class="detail-val">{{ detail.application?.contact_full_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Job Title</span>
                  <span class="detail-val">{{ detail.application?.contact_job_title || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Email</span>
                  <span class="detail-val">{{ detail.application?.contact_email }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Phone</span>
                  <span class="detail-val">{{ detail.application?.contact_phone || '—' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section mt-4">
              <p class="section-label">Service Interest</p>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-key">Package</span>
                  <span class="detail-val capitalize">{{
                    detail.application?.service_package?.replace(/_/g, ' ') || '—'
                  }}</span>
                </div>
                <div class="detail-item full-width">
                  <span class="detail-key">Needs Description</span>
                  <span class="detail-val">{{
                    detail.application?.description_of_needs || '—'
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Existing Compliance</span>
                  <v-chip
                    size="x-small"
                    :color="
                      detail.application?.has_existing_compliance_program ? 'success' : 'grey'
                    "
                  >
                    {{ detail.application?.has_existing_compliance_program ? 'Yes' : 'No' }}
                  </v-chip>
                </div>
                <div class="detail-item">
                  <span class="detail-key">Est. Txn Volume</span>
                  <span class="detail-val">{{
                    detail.application?.estimated_monthly_transactions || '—'
                  }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section mt-4" v-if="detail.application?.review_notes">
              <p class="section-label">Review Notes</p>
              <v-alert type="info" variant="tonal" density="compact" class="text-body-2">
                {{ detail.application.review_notes }}
              </v-alert>
            </div>
          </v-tabs-window-item>

          <!-- Directors -->
          <v-tabs-window-item value="directors">
            <div v-if="!detail.directors?.length" class="empty-state py-10 text-center">
              <font-awesome-icon icon="fa-solid fa-users" class="text-h3 text-disabled mb-3" />
              <p class="text-body-2 text-medium-emphasis">No directors added</p>
            </div>
            <v-card
              v-for="dir in detail.directors"
              :key="dir.id"
              class="mb-3 director-card"
              variant="outlined"
              rounded="lg"
            >
              <v-card-text class="pa-4">
                <div class="d-flex align-start justify-space-between mb-2">
                  <div>
                    <p class="font-weight-semibold text-body-1">{{ dir.full_name }}</p>
                    <p class="text-caption text-medium-emphasis">{{ dir.job_title }}</p>
                  </div>
                  <div class="d-flex gap-1">
                    <v-chip v-if="dir.is_ubo" size="x-small" color="purple" variant="tonal"
                      >UBO</v-chip
                    >
                    <v-chip
                      v-if="dir.ownership_percent"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ dir.ownership_percent }}%
                    </v-chip>
                  </div>
                </div>
                <div class="detail-grid mt-2">
                  <div class="detail-item">
                    <span class="detail-key">Nationality</span
                    ><span class="detail-val">{{ dir.nationality || '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-key">DOB</span
                    ><span class="detail-val">{{
                      dir.date_of_birth ? fmtDate(dir.date_of_birth) : '—'
                    }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-key">ID Type</span
                    ><span class="detail-val">{{ dir.id_type || '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-key">ID Number</span
                    ><span class="detail-val">{{ dir.id_number || '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-key">Email</span
                    ><span class="detail-val">{{ dir.email || '—' }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- Documents -->
          <v-tabs-window-item value="documents">
            <div v-if="!detail.documents?.length" class="empty-state py-10 text-center">
              <font-awesome-icon
                icon="fa-solid fa-folder-open"
                class="text-h3 text-disabled mb-3"
              />
              <p class="text-body-2 text-medium-emphasis">No documents uploaded</p>
            </div>
            <div
              v-for="doc in detail.documents"
              :key="doc.id"
              class="doc-row d-flex align-center justify-space-between pa-3 mb-2 rounded-lg"
            >
              <div class="d-flex align-center gap-3">
                <div class="doc-icon">
                  <font-awesome-icon :icon="mimeIcon(doc.mime_type)" />
                </div>
                <div>
                  <p class="text-body-2 font-weight-medium">{{ doc.file_name }}</p>
                  <p class="text-caption text-medium-emphasis">
                    {{ doc.doc_type?.replace(/_/g, ' ') }} · {{ fmtSize(doc.file_size) }}
                  </p>
                </div>
              </div>
              <div class="d-flex align-center gap-2">
                <v-chip
                  :color="doc.is_confirmed ? 'success' : 'warning'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ doc.is_confirmed ? 'Confirmed' : 'Pending' }}
                </v-chip>
                <v-btn
                  v-if="doc.file_path"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  :href="doc.file_path"
                  target="_blank"
                >
                  <font-awesome-icon icon="fa-solid fa-download" />
                </v-btn>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </template>

      <!-- ── ASSESSMENT DETAIL ─────────────────── -->
      <template v-if="mode === 'assessment'">
        <!-- Score Banner -->
        <div
          class="score-banner mx-5 my-4 pa-4 rounded-xl d-flex align-center justify-space-between"
        >
          <div>
            <p class="text-caption text-medium-emphasis mb-1">Compliance Health Score</p>
            <div class="d-flex align-baseline gap-2">
              <span class="text-h3 font-weight-black score-num">
                {{
                  detail.assessment?.health_score != null
                    ? detail.assessment.health_score.toFixed(1)
                    : '—'
                }}
              </span>
              <span class="text-body-2 text-medium-emphasis">/ 100</span>
            </div>
          </div>
          <div class="text-right">
            <v-chip
              :color="healthRatingColor(detail.assessment?.health_rating)"
              variant="flat"
              size="default"
              class="font-weight-bold text-uppercase"
            >
              {{ detail.assessment?.health_rating || 'Not Rated' }}
            </v-chip>
            <p class="text-caption text-medium-emphasis mt-2">
              {{ detail.assessment?.entity_category?.replace(/_/g, ' ') }}
            </p>
          </div>
        </div>

        <v-tabs v-model="activeTab" color="primary" density="compact" class="px-4">
          <v-tab value="gaps">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="mr-2" />
            Gaps
            <v-badge
              v-if="detail.gaps?.length"
              :content="detail.gaps.length"
              color="error"
              class="ml-2"
              inline
            />
          </v-tab>
          <v-tab value="modules">
            <font-awesome-icon icon="fa-solid fa-chart-pie" class="mr-2" />
            Module Scores
          </v-tab>
          <v-tab value="actions">
            <font-awesome-icon icon="fa-solid fa-list-check" class="mr-2" />
            Actions
            <v-badge
              v-if="detail.actions?.length"
              :content="detail.actions.length"
              color="primary"
              class="ml-2"
              inline
            />
          </v-tab>
          <v-tab value="findings">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
            Findings
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-tabs-window v-model="activeTab" class="pa-5">
          <!-- Gaps -->
          <v-tabs-window-item value="gaps">
            <div v-if="!detail.gaps?.length" class="empty-state py-10 text-center">
              <font-awesome-icon
                icon="fa-solid fa-circle-check"
                class="text-h3 text-success mb-3"
              />
              <p class="text-body-2 text-medium-emphasis">No gaps identified</p>
            </div>
            <div
              v-for="gap in detail.gaps"
              :key="gap.id"
              class="gap-card mb-3 pa-4 rounded-xl"
              :style="`border-left: 3px solid ${riskRatingColor(gap.risk_rating)}`"
            >
              <div class="d-flex align-start justify-space-between mb-2">
                <div class="flex-grow-1 mr-3">
                  <div class="d-flex align-center gap-2 mb-1">
                    <code class="ref-code">{{ gap.gap_ref }}</code>
                    <v-chip
                      :color="riskChipColor(gap.risk_rating)"
                      size="x-small"
                      variant="flat"
                      class="text-uppercase font-weight-bold"
                    >
                      {{ gap.risk_rating }}
                    </v-chip>
                    <v-chip :color="gapStatusColor(gap.status)" size="x-small" variant="tonal">
                      {{ gap.status }}
                    </v-chip>
                  </div>
                  <p class="text-body-2 font-weight-medium">{{ gap.title }}</p>
                </div>
              </div>
              <p class="text-caption text-medium-emphasis mb-2">{{ gap.description }}</p>
              <div v-if="gap.remediation_action" class="remediation-box pa-2 rounded-lg mt-2">
                <p
                  class="text-caption font-weight-semibold mb-1"
                  style="color: var(--v-theme-primary)"
                >
                  <font-awesome-icon icon="fa-solid fa-lightbulb" class="mr-1" />Remediation
                </p>
                <p class="text-caption">{{ gap.remediation_action }}</p>
              </div>
              <div class="d-flex align-center gap-3 mt-2 text-caption text-medium-emphasis">
                <span v-if="gap.assignee_name">
                  <font-awesome-icon icon="fa-solid fa-user" class="mr-1" />{{ gap.assignee_name }}
                </span>
                <span v-if="gap.due_date">
                  <font-awesome-icon icon="fa-regular fa-calendar" class="mr-1" />Due
                  {{ fmtDate(gap.due_date) }}
                </span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Module Scores -->
          <v-tabs-window-item value="modules">
            <div v-if="!detail.module_scores?.length" class="empty-state py-10 text-center">
              <p class="text-body-2 text-medium-emphasis">No module scores available</p>
            </div>
            <div
              v-for="mod in detail.module_scores"
              :key="mod.module_code"
              class="module-score-row mb-4"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <div>
                  <p class="text-body-2 font-weight-medium">{{ mod.module_name }}</p>
                  <p class="text-caption text-medium-emphasis">
                    {{ mod.module_code }} · Weight contribution:
                    {{ mod.weighted_contribution?.toFixed(1) ?? '—' }}
                  </p>
                </div>
                <span
                  class="text-body-1 font-weight-bold"
                  :style="`color: ${scoreColor(mod.module_score)}`"
                >
                  {{ mod.module_score != null ? mod.module_score.toFixed(1) + '%' : '—' }}
                </span>
              </div>
              <v-progress-linear
                :model-value="mod.module_score ?? 0"
                :color="scoreColor(mod.module_score)"
                bg-color="surface-variant"
                height="6"
                rounded
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ mod.earned_points }} / {{ mod.total_points }} pts
              </p>
            </div>
          </v-tabs-window-item>

          <!-- Actions -->
          <v-tabs-window-item value="actions">
            <div v-if="!detail.actions?.length" class="empty-state py-10 text-center">
              <p class="text-body-2 text-medium-emphasis">No action plans yet</p>
            </div>
            <div
              v-for="action in detail.actions"
              :key="action.id"
              class="action-row d-flex align-start gap-3 mb-3 pa-3 rounded-xl"
            >
              <div
                class="action-status-dot mt-1"
                :style="`background: ${actionStatusColor(action.status)}`"
              />
              <div class="flex-grow-1">
                <div class="d-flex align-center gap-2 mb-1">
                  <code class="ref-code">{{ action.action_ref }}</code>
                  <v-chip :color="actionStatusColor(action.status)" size="x-small" variant="tonal">
                    {{ action.status?.replace(/_/g, ' ') }}
                  </v-chip>
                </div>
                <p class="text-body-2">{{ action.description }}</p>
                <div class="d-flex gap-3 mt-1 text-caption text-medium-emphasis">
                  <span v-if="action.assignee_name"
                    ><font-awesome-icon icon="fa-solid fa-user" class="mr-1" />{{
                      action.assignee_name
                    }}</span
                  >
                  <span v-if="action.due_date"
                    ><font-awesome-icon icon="fa-regular fa-calendar" class="mr-1" />{{
                      fmtDate(action.due_date)
                    }}</span
                  >
                  <span v-if="action.completed_at" class="text-success"
                    ><font-awesome-icon icon="fa-solid fa-check" class="mr-1" />Done
                    {{ fmtDate(action.completed_at) }}</span
                  >
                </div>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Findings -->
          <v-tabs-window-item value="findings">
            <div v-if="!detail.findings?.length" class="empty-state py-10 text-center">
              <p class="text-body-2 text-medium-emphasis">No findings recorded</p>
            </div>
            <div
              v-for="finding in detail.findings"
              :key="finding.id"
              class="gap-card mb-3 pa-4 rounded-xl"
            >
              <div class="d-flex align-start justify-space-between mb-1">
                <div>
                  <div class="d-flex gap-2 align-center mb-1">
                    <code class="ref-code">{{ finding.finding_ref }}</code>
                    <v-chip
                      :color="riskChipColor(finding.severity)"
                      size="x-small"
                      variant="flat"
                      class="text-uppercase font-weight-bold"
                    >
                      {{ finding.severity }}
                    </v-chip>
                    <v-chip
                      :color="finding.is_resolved ? 'success' : 'error'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ finding.is_resolved ? 'Resolved' : 'Open' }}
                    </v-chip>
                  </div>
                  <p class="text-body-2 font-weight-medium">{{ finding.title }}</p>
                </div>
              </div>
              <p class="text-caption text-medium-emphasis">{{ finding.description }}</p>
              <div v-if="finding.recommendation" class="remediation-box pa-2 rounded-lg mt-2">
                <p
                  class="text-caption font-weight-semibold mb-1"
                  style="color: var(--v-theme-primary)"
                >
                  <font-awesome-icon icon="fa-solid fa-lightbulb" class="mr-1" />Recommendation
                </p>
                <p class="text-caption">{{ finding.recommendation }}</p>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </template>
    </template>

    <!-- Actions footer -->
    <template #append v-if="!loading && detail">
      <v-divider />
      <div class="pa-4 d-flex gap-2 flex-wrap">
        <slot name="actions" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useClients } from '@/composables/useClients'

const props = defineProps<{
  modelValue: boolean
  mode: 'application' | 'assessment'
  itemId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { fetchApplicationDetail, fetchAssessmentDetail, healthRatingColor, riskRatingColor } =
  useClients()

const loading = ref(false)
const detail = ref<any>(null)
const activeTab = ref('overview')

const headerLabel = computed(() =>
  props.mode === 'application' ? 'Onboarding Application' : 'Compliance Assessment'
)

const title = computed(
  () => detail.value?.application?.company_name || detail.value?.client?.company_name || '—'
)

const subtitle = computed(
  () =>
    detail.value?.application?.reference_number || detail.value?.assessment?.assessment_ref || ''
)

watch(
  () => [props.modelValue, props.itemId],
  async ([open, id]) => {
    if (!open || !id) {
      detail.value = null
      return
    }
    loading.value = true
    activeTab.value = props.mode === 'application' ? 'overview' : 'gaps'
    try {
      if (props.mode === 'application') {
        detail.value = await fetchApplicationDetail(id as string)
      } else {
        detail.value = await fetchAssessmentDetail(id as string)
      }
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

// ── Helpers ──────────────────────────────────
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function fmtSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function mimeIcon(mime: string | null) {
  if (!mime) return 'fa-solid fa-file'
  if (mime.includes('pdf')) return 'fa-solid fa-file-pdf'
  if (mime.includes('image')) return 'fa-solid fa-file-image'
  if (mime.includes('sheet') || mime.includes('excel')) return 'fa-solid fa-file-excel'
  if (mime.includes('word')) return 'fa-solid fa-file-word'
  return 'fa-solid fa-file'
}

function scoreColor(score: number | null) {
  if (score == null) return '#9E9E9E'
  if (score >= 80) return '#43A047'
  if (score >= 60) return '#FB8C00'
  if (score >= 40) return '#E53935'
  return '#B71C1C'
}

function riskChipColor(rating: string) {
  const map: Record<string, string> = {
    critical: 'deep-orange-darken-3',
    high: 'error',
    medium: 'warning',
    low: 'success'
  }
  return map[rating?.toLowerCase()] ?? 'grey'
}

function gapStatusColor(status: string) {
  const map: Record<string, string> = {
    open: 'error',
    in_progress: 'warning',
    resolved: 'success',
    accepted: 'info'
  }
  return map[status?.toLowerCase()] ?? 'grey'
}

function actionStatusColor(status: string) {
  const map: Record<string, string> = {
    open: '#E53935',
    in_progress: '#FB8C00',
    completed: '#43A047',
    overdue: '#B71C1C',
    cancelled: '#9E9E9E'
  }
  return map[status?.toLowerCase()] ?? '#9E9E9E'
}
</script>

<style scoped>
.client-detail-drawer {
  display: flex;
  flex-direction: column;
}

.drawer-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #4a2c8f 100%);
  flex-shrink: 0;
}

.score-banner {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
}
.score-num {
  color: rgb(var(--v-theme-primary));
}

.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-key {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 600;
}

.detail-val {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 500;
}

.capitalize {
  text-transform: capitalize;
}

.director-card {
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
}

.doc-row {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.doc-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.gap-card {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-outline), 0.15);
}

.remediation-box {
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

.ref-code {
  font-size: 0.7rem;
  background: rgba(var(--v-theme-surface-variant), 1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  color: rgb(var(--v-theme-primary));
}

.module-score-row {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
  padding-bottom: 12px;
}

.action-row {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-outline), 0.15);
}

.action-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-state {
  opacity: 0.6;
}
</style>
