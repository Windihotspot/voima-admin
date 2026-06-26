<template>
  <v-dialog v-model="dialogOpen" max-width="520" persistent>
    <v-card rounded="xl" elevation="8">
      <!-- Header -->
      <div class="dialog-header pa-5 pb-4">
        <div class="d-flex align-center gap-3">
          <div class="dialog-icon" :style="`background: ${iconBg}`">
            <font-awesome-icon :icon="iconName" :style="`color: ${iconColor}`" />
          </div>
          <div>
            <p class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-0">
              {{ label }}
            </p>
            <h3 class="text-h6 font-weight-bold">{{ title }}</h3>
          </div>
        </div>
      </div>

      <v-divider />

      <v-card-text class="pa-5">
        <!-- Context card -->
        <div class="context-card pa-4 mb-4 rounded-xl">
          <div class="d-flex align-center gap-2 mb-2">
            <font-awesome-icon icon="fa-solid fa-building" class="text-primary text-body-2" />
            <p class="text-body-2 font-weight-semibold mb-0">{{ companyName }}</p>
          </div>
          <div class="d-flex gap-3 text-caption text-medium-emphasis flex-wrap">
            <span v-if="refNumber">
              <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />{{ refNumber }}
            </span>
            <span v-if="extraInfo">
              <font-awesome-icon icon="fa-solid fa-info-circle" class="mr-1" />{{ extraInfo }}
            </span>
          </div>
        </div>

        <!-- Action-specific fields -->
        <template v-if="action === 'convert'">
          <p class="text-body-2 font-weight-medium mb-3">Assign Team Members</p>
          <v-autocomplete
            v-model="form.consultantId"
            label="Assigned Consultant"
            :items="consultants"
            item-title="full_name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            clearable
            class="mb-3"
          >
            <template #prepend-inner>
              <font-awesome-icon icon="fa-solid fa-user-tie" class="text-medium-emphasis" />
            </template>
          </v-autocomplete>
          <v-autocomplete
            v-model="form.rmId"
            label="Relationship Manager"
            :items="consultants"
            item-title="full_name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            clearable
            class="mb-3"
          >
            <template #prepend-inner>
              <font-awesome-icon icon="fa-solid fa-handshake" class="text-medium-emphasis" />
            </template>
          </v-autocomplete>
          <v-text-field
            v-model="form.startDate"
            label="Engagement Start Date"
            type="date"
            variant="outlined"
            density="comfortable"
          >
            <template #prepend-inner>
              <font-awesome-icon icon="fa-regular fa-calendar" class="text-medium-emphasis" />
            </template>
          </v-text-field>
        </template>

        <!-- Notes -->
        <v-textarea
          v-model="form.notes"
          :label="notesLabel"
          variant="outlined"
          density="comfortable"
          rows="3"
          :placeholder="notesPlaceholder"
          auto-grow
          class="mt-2"
        >
          <template #prepend-inner>
            <font-awesome-icon
              icon="fa-regular fa-comment-dots"
              class="text-medium-emphasis mt-1"
            />
          </template>
        </v-textarea>

        <!-- Warning -->
        <v-alert
          v-if="warningText"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3 text-body-2"
        >
          {{ warningText }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex gap-2">
        <v-btn
          variant="outlined"
          color="medium-emphasis"
          :disabled="loading"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn
          :color="confirmColor"
          variant="flat"
          :loading="loading"
          :disabled="loading"
          rounded="lg"
          min-width="120"
          @click="confirm"
        >
          <font-awesome-icon :icon="confirmIcon" class="mr-2" />
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  action:
    | 'approve_waitlist'
    | 'reject_waitlist'
    | 'approve_app'
    | 'reject_app'
    | 'request_info'
    | 'convert'
    | 'publish'
    | 'flag_review'
  companyName: string
  refNumber?: string
  extraInfo?: string
  consultants?: { id: string; full_name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (
    e: 'confirm',
    payload: { notes: string; consultantId?: string; rmId?: string; startDate?: string }
  ): void
}>()

// Add this computed proxy
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  notes: '',
  consultantId: null as string | null,
  rmId: null as string | null,
  startDate: new Date().toISOString().split('T')[0]
})

watch(
  () => props.modelValue,
  (v) => {
    if (v)
      form.value = {
        notes: '',
        consultantId: null,
        rmId: null,
        startDate: new Date().toISOString().split('T')[0]
      }
  }
)

const config = computed(() => {
  const map: Record<
    string,
    {
      label: string
      title: string
      icon: string
      iconBg: string
      iconColor: string
      confirmLabel: string
      confirmColor: string
      confirmIcon: string
      notesLabel: string
      notesPlaceholder: string
      warningText?: string
    }
  > = {
    approve_waitlist: {
      label: 'Waitlist',
      title: 'Approve Waitlist Entry',
      icon: 'fa-solid fa-check-circle',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      confirmLabel: 'Approve',
      confirmColor: 'success',
      confirmIcon: 'fa-solid fa-check',
      notesLabel: 'Approval Notes (optional)',
      notesPlaceholder: 'Add any notes for this approval...'
    },
    reject_waitlist: {
      label: 'Waitlist',
      title: 'Reject Waitlist Entry',
      icon: 'fa-solid fa-times-circle',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      confirmLabel: 'Reject',
      confirmColor: 'error',
      confirmIcon: 'fa-solid fa-times',
      notesLabel: 'Rejection Reason',
      notesPlaceholder: 'Explain why this entry is being rejected...',
      warningText: 'This action will notify the applicant that their entry has been rejected.'
    },
    approve_app: {
      label: 'Application',
      title: 'Approve Application',
      icon: 'fa-solid fa-check-double',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      confirmLabel: 'Approve',
      confirmColor: 'success',
      confirmIcon: 'fa-solid fa-check',
      notesLabel: 'Approval Notes (optional)',
      notesPlaceholder: 'Notes on this approval...'
    },
    reject_app: {
      label: 'Application',
      title: 'Reject Application',
      icon: 'fa-solid fa-ban',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      confirmLabel: 'Reject',
      confirmColor: 'error',
      confirmIcon: 'fa-solid fa-times',
      notesLabel: 'Rejection Reason',
      notesPlaceholder: 'Provide reason for rejection...',
      warningText: 'The applicant will be notified of this decision.'
    },
    request_info: {
      label: 'Application',
      title: 'Request More Information',
      icon: 'fa-solid fa-circle-question',
      iconBg: '#fef9c3',
      iconColor: '#ca8a04',
      confirmLabel: 'Send Request',
      confirmColor: 'warning',
      confirmIcon: 'fa-solid fa-paper-plane',
      notesLabel: 'Information Required',
      notesPlaceholder: 'Describe what additional information is needed...'
    },
    convert: {
      label: 'Onboarding',
      title: 'Convert to Active Client',
      icon: 'fa-solid fa-sync-alt',
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      confirmLabel: 'Convert & Activate',
      confirmColor: 'primary',
      confirmIcon: 'fa-solid fa-rocket',
      notesLabel: 'Onboarding Notes (optional)',
      notesPlaceholder: 'Any notes for the client record...',
      warningText: 'This will create a client account and active engagement. This cannot be undone.'
    },
    publish: {
      label: 'Assessment',
      title: 'Publish Gap Analysis',
      icon: 'fa-solid fa-globe',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      confirmLabel: 'Publish',
      confirmColor: 'success',
      confirmIcon: 'fa-solid fa-globe',
      notesLabel: 'Review Notes (optional)',
      notesPlaceholder: 'Any notes to accompany the published assessment...',
      warningText:
        'Publishing will notify the client and make the gap analysis and action plan visible to them.'
    },
    flag_review: {
      label: 'Assessment',
      title: 'Flag for Review',
      icon: 'fa-solid fa-flag',
      iconBg: '#fef9c3',
      iconColor: '#ca8a04',
      confirmLabel: 'Flag',
      confirmColor: 'warning',
      confirmIcon: 'fa-solid fa-flag',
      notesLabel: 'Review Notes',
      notesPlaceholder: 'Explain what needs to be reviewed...'
    }
  }
  return map[props.action] ?? map['approve_waitlist']
})

const label = computed(() => config.value.label)
const title = computed(() => config.value.title)
const iconName = computed(() => config.value.icon)
const iconBg = computed(() => config.value.iconBg)
const iconColor = computed(() => config.value.iconColor)
const confirmLabel = computed(() => config.value.confirmLabel)
const confirmColor = computed(() => config.value.confirmColor)
const confirmIcon = computed(() => config.value.confirmIcon)
const notesLabel = computed(() => config.value.notesLabel)
const notesPlaceholder = computed(() => config.value.notesPlaceholder)
const warningText = computed(() => config.value.warningText)

function confirm() {
  emit('confirm', {
    notes: form.value.notes,
    consultantId: form.value.consultantId ?? undefined,
    rmId: form.value.rmId ?? undefined,
    startDate: form.value.startDate
  })
}
</script>

<style scoped>
.dialog-header {
  background: rgba(var(--v-theme-surface-variant), 0.4);
}
.dialog-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.context-card {
  background: rgba(var(--v-theme-surface-variant), 0.6);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}
</style>
