<template>
  <!-- Full-screen slide-over panel -->
  <Teleport to="body">
    <Transition name="panel-slide">
      <div v-if="modelValue" class="arp-overlay" @click.self="close">
        <div class="arp-panel">
          <!-- ── HEADER ────────────────────────────────────── -->
          <div class="arp-header">
            <div class="arp-header-left">
              <button class="arp-back-btn" @click="close">
                <font-awesome-icon icon="fa-solid fa-arrow-left" />
              </button>
              <div>
                <div class="arp-eyebrow">Assessment Review</div>
                <h2 class="arp-title">{{ d?.client?.company_name ?? '—' }}</h2>
                <div class="arp-meta">
                  <span>{{ d?.assessment_ref }}</span>
                  <span class="arp-dot">·</span>
                  <span class="capitalize">{{ d?.entity_category?.replace(/_/g, ' ') }}</span>
                  <span class="arp-dot">·</span>
                  <span>{{ d?.engagement?.service_package?.replace(/_/g, ' ') ?? '—' }}</span>
                </div>
              </div>
            </div>
            <div class="arp-header-right">
              <div class="arp-status-pill" :style="statusPillStyle(d?.status)">
                {{ fmtStatus(d?.status) }}
              </div>
              <!-- Admin CTA buttons -->
              <v-btn
                v-if="d?.status === 'under_review'"
                color="success"
                variant="flat"
                size="small"
                rounded="lg"
                :loading="actionLoading.publish"
                @click="openPublish"
              >
                <font-awesome-icon icon="fa-solid fa-globe" class="mr-2" />Publish
              </v-btn>
              <v-btn
                v-if="['completed', 'in_progress'].includes(d?.status)"
                color="warning"
                variant="tonal"
                size="small"
                rounded="lg"
                @click="openFlagReview"
              >
                <font-awesome-icon icon="fa-solid fa-flag" class="mr-2" />Flag for Review
              </v-btn>
              <v-btn icon size="small" variant="text" @click="close">
                <font-awesome-icon icon="fa-solid fa-xmark" />
              </v-btn>
            </div>
          </div>

          <!-- ── LOADING ────────────────────────────────────── -->
          <div v-if="loading" class="arp-loader">
            <v-progress-circular indeterminate color="#2563eb" size="44" width="3" />
            <p>Loading assessment data…</p>
          </div>

          <!-- ── BODY ───────────────────────────────────────── -->
          <div v-else-if="d" class="arp-body">
            <!-- Inner tab navigation -->
            <div class="arp-tabs">
              <button
                v-for="t in innerTabs"
                :key="t.key"
                class="arp-tab"
                :class="{ active: innerTab === t.key }"
                @click="innerTab = t.key"
              >
                <font-awesome-icon :icon="t.icon" class="mr-2" />
                {{ t.label }}
                <span v-if="t.count" class="arp-tab-badge">{{ t.count }}</span>
              </button>
            </div>

            <div class="arp-tab-body">
              <!-- ════════════════════════════════════════════
                   TAB: DASHBOARD  (mirrors client view exactly)
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'dashboard'">
                <!-- KPI strip -->
                <div class="ch-kpi-strip">
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #eff6ff">
                      <font-awesome-icon
                        icon="fa-solid fa-shield-halved"
                        style="color: #2563eb; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" :style="{ color: gaugeColor }">
                        {{ healthScore }}%
                      </div>
                      <div class="ch-kpi-label">Health Score</div>
                    </div>
                  </div>
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #fef2f2">
                      <font-awesome-icon
                        icon="fa-solid fa-circle-exclamation"
                        style="color: #dc2626; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" style="color: #dc2626">
                        {{ gapSummary.open ?? 0 }}
                      </div>
                      <div class="ch-kpi-label">Open Gaps</div>
                    </div>
                  </div>
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #fff7ed">
                      <font-awesome-icon
                        icon="fa-solid fa-fire"
                        style="color: #ea580c; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" style="color: #ea580c">
                        {{ gapSummary.critical ?? 0 }}
                      </div>
                      <div class="ch-kpi-label">Critical</div>
                    </div>
                  </div>
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #f0fdf4">
                      <font-awesome-icon
                        icon="fa-solid fa-circle-check"
                        style="color: #16a34a; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" style="color: #16a34a">
                        {{ responseStats.yes ?? 0 }}
                      </div>
                      <div class="ch-kpi-label">Compliant</div>
                    </div>
                  </div>
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #f8fafc">
                      <font-awesome-icon
                        icon="fa-solid fa-circle-question"
                        style="color: #64748b; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" style="color: #64748b">
                        {{ responseStats.unanswered ?? 0 }}
                      </div>
                      <div class="ch-kpi-label">Unanswered</div>
                    </div>
                  </div>
                  <div class="ch-kpi-card">
                    <div class="ch-kpi-icon" style="background: #f8fafc">
                      <font-awesome-icon
                        icon="fa-solid fa-list"
                        style="color: #64748b; font-size: 18px"
                      />
                    </div>
                    <div>
                      <div class="ch-kpi-value" style="color: #334155">
                        {{ moduleScores.length }}
                      </div>
                      <div class="ch-kpi-label">Modules</div>
                    </div>
                  </div>
                </div>

                <!-- Row 1: Gauge + Radar -->
                <div class="ch-grid-2 mt-5">
                  <div class="ch-card">
                    <div class="ch-card-head">
                      <font-awesome-icon icon="fa-solid fa-gauge-high" style="color: #2563eb" />
                      <span class="ch-card-title">Overall Compliance Score</span>
                    </div>
                    <div class="ch-card-body ch-gauge-body">
                      <VueApexCharts
                        type="radialBar"
                        height="260"
                        :options="radialOptions"
                        :series="radialSeries"
                      />
                      <div class="ch-gauge-meta">
                        <div
                          class="ch-rating-badge"
                          :style="{
                            background: rating.bg,
                            color: rating.color,
                            borderColor: rating.border
                          }"
                        >
                          {{ rating.label }}
                        </div>
                        <p class="ch-gauge-hint">
                          Based on {{ moduleScores.length }} modules weighted by risk category
                        </p>
                      </div>
                      <div class="ch-scale">
                        <div class="ch-scale-item" v-for="r in ratingScale" :key="r.label">
                          <span class="ch-scale-dot" :style="{ background: r.color }" />
                          <span class="ch-scale-range">{{ r.range }}</span>
                          <span class="ch-scale-label">{{ r.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="ch-card">
                    <div class="ch-card-head">
                      <font-awesome-icon icon="fa-solid fa-circle-nodes" style="color: #2563eb" />
                      <span class="ch-card-title">Module Coverage Radar</span>
                    </div>
                    <div class="ch-card-body">
                      <VueApexCharts
                        v-if="moduleScores.length"
                        type="radar"
                        height="280"
                        :options="radarOptions"
                        :series="radarSeries"
                      />
                      <div v-else class="ch-chart-empty">No module data yet</div>
                    </div>
                  </div>
                </div>

                <!-- Row 2: Module bar (full width) -->
                <div class="ch-card mt-5">
                  <div class="ch-card-head">
                    <font-awesome-icon icon="fa-solid fa-bars-progress" style="color: #2563eb" />
                    <span class="ch-card-title">Score by Module</span>
                  </div>
                  <div class="ch-card-body">
                    <VueApexCharts
                      v-if="moduleScores.length"
                      type="bar"
                      :height="Math.max(260, moduleScores.length * 46)"
                      :options="moduleBarOptions"
                      :series="moduleBarSeries"
                    />
                  </div>
                </div>

                <!-- Row 3: Gap donut + Response donut -->
                <div class="ch-grid-2 mt-5">
                  <div class="ch-card">
                    <div class="ch-card-head">
                      <font-awesome-icon
                        icon="fa-solid fa-triangle-exclamation"
                        style="color: #dc2626"
                      />
                      <span class="ch-card-title">Gap Breakdown</span>
                    </div>
                    <div class="ch-card-body">
                      <VueApexCharts
                        type="donut"
                        height="240"
                        :options="gapDonutOptions"
                        :series="gapDonutSeries"
                      />
                      <div class="ch-gap-pills">
                        <div class="ch-gap-pill critical">
                          <span class="ch-gap-pill-val">{{ gapSummary.critical ?? 0 }}</span
                          ><span>Critical</span>
                        </div>
                        <div class="ch-gap-pill high">
                          <span class="ch-gap-pill-val">{{ gapSummary.high ?? 0 }}</span
                          ><span>High</span>
                        </div>
                        <div class="ch-gap-pill medium">
                          <span class="ch-gap-pill-val">{{ gapSummary.medium ?? 0 }}</span
                          ><span>Medium</span>
                        </div>
                        <div class="ch-gap-pill low">
                          <span class="ch-gap-pill-val">{{ gapSummary.low ?? 0 }}</span
                          ><span>Low</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="ch-card">
                    <div class="ch-card-head">
                      <font-awesome-icon icon="fa-solid fa-chart-pie" style="color: #2563eb" />
                      <span class="ch-card-title">Response Breakdown</span>
                    </div>
                    <div class="ch-card-body">
                      <VueApexCharts
                        type="donut"
                        height="240"
                        :options="responseDonutOptions"
                        :series="responseDonutSeries"
                      />
                      <div class="ch-resp-stats">
                        <div class="ch-resp-stat">
                          <span class="ch-resp-dot" style="background: #22c55e" /><span
                            >Compliant</span
                          ><span class="ch-resp-val">{{ responseStats.yes ?? 0 }}</span>
                        </div>
                        <div class="ch-resp-stat">
                          <span class="ch-resp-dot" style="background: #ef4444" /><span>Gaps</span
                          ><span class="ch-resp-val">{{ responseStats.no ?? 0 }}</span>
                        </div>
                        <div class="ch-resp-stat">
                          <span class="ch-resp-dot" style="background: #94a3b8" /><span>N/A</span
                          ><span class="ch-resp-val">{{ responseStats.na ?? 0 }}</span>
                        </div>
                        <div class="ch-resp-stat">
                          <span class="ch-resp-dot" style="background: #e2e8f0" /><span
                            >Unanswered</span
                          ><span class="ch-resp-val">{{ responseStats.unanswered ?? 0 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Row 4: Module table -->
                <div class="ch-card mt-5">
                  <div class="ch-card-head">
                    <font-awesome-icon icon="fa-solid fa-table-list" style="color: #2563eb" />
                    <span class="ch-card-title">Module Detail</span>
                  </div>
                  <div class="ch-table-wrap">
                    <table class="ch-table">
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Score</th>
                          <th class="ch-th-bar">Progress</th>
                          <th>Weight</th>
                          <th>Points</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="mod in moduleScores" :key="mod.module_id">
                          <td>
                            <div class="ch-mod-name">{{ mod.module_name }}</div>
                            <div class="ch-mod-desc">{{ mod.module_description }}</div>
                          </td>
                          <td>
                            <span
                              class="ch-score-num"
                              :style="{ color: scoreBarColor(mod.module_score) }"
                              >{{ Math.round(mod.module_score ?? 0) }}%</span
                            >
                          </td>
                          <td class="ch-td-bar">
                            <div class="ch-bar-track">
                              <div
                                class="ch-bar-fill"
                                :style="{
                                  width: Math.round(mod.module_score ?? 0) + '%',
                                  background: scoreBarColor(mod.module_score)
                                }"
                              />
                            </div>
                          </td>
                          <td>
                            <span class="ch-weight-pill">{{ mod.weight ?? 0 }}%</span>
                          </td>
                          <td class="text-sm text-slate-500">
                            {{ mod.earned_points }}/{{ mod.total_points }}
                          </td>
                          <td>
                            <span
                              class="ch-mod-rating"
                              :style="{
                                background: moduleRatingLabel(mod.module_score).bg,
                                color: moduleRatingLabel(mod.module_score).color
                              }"
                            >
                              {{ moduleRatingLabel(mod.module_score).label }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Score adjustment (admin only) -->
                <div class="ch-card mt-5 admin-only-card">
                  <div class="ch-card-head">
                    <font-awesome-icon icon="fa-solid fa-sliders" style="color: #7c3aed" />
                    <span class="ch-card-title">Score Adjustment</span>
                    <span class="ch-card-sub admin-badge">Admin Only</span>
                  </div>
                  <div class="ch-card-body">
                    <p class="text-sm text-slate-500 mb-4">
                      Apply a manual positive or negative adjustment to the health score. Current
                      adjustments: <strong>{{ d.score_adjustments ?? 0 }}</strong> pts
                    </p>
                    <div class="d-flex gap-3 align-end flex-wrap">
                      <v-text-field
                        v-model.number="scoreAdj.points"
                        label="Points (e.g. -5 or +3)"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 140px"
                      />
                      <v-text-field
                        v-model="scoreAdj.reason"
                        label="Reason"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 340px"
                      />
                      <v-btn
                        color="purple"
                        variant="tonal"
                        size="small"
                        :loading="actionLoading.scoreAdj"
                        :disabled="!scoreAdj.reason || scoreAdj.points === 0"
                        @click="applyScoreAdjustment"
                      >
                        Apply
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ════════════════════════════════════════════
                   TAB: GAPS
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'gaps'">
                <div class="arp-section-toolbar">
                  <v-select
                    v-model="gapFilter"
                    :items="['all', 'critical', 'high', 'medium', 'low']"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 160px"
                    label="Risk Rating"
                  />
                  <v-select
                    v-model="gapStatusFilter"
                    :items="['all', 'open', 'in_progress', 'completed', 'overdue']"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 160px"
                    label="Status"
                  />
                </div>

                <div v-if="!filteredGaps.length" class="arp-empty">
                  No gaps match the current filter.
                </div>

                <div
                  v-for="gap in filteredGaps"
                  :key="gap.id"
                  class="gap-card"
                  :style="`border-left-color: ${riskColor(gap.risk_rating)}`"
                >
                  <div class="gap-card-head">
                    <div class="gap-card-left">
                      <code class="ref-code">{{ gap.gap_ref }}</code>
                      <v-chip
                        :color="riskChipColor(gap.risk_rating)"
                        size="x-small"
                        variant="flat"
                        class="font-weight-bold text-uppercase"
                        >{{ gap.risk_rating }}</v-chip
                      >
                      <v-chip :color="gapStatusColor(gap.status)" size="x-small" variant="tonal">{{
                        gap.status?.replace(/_/g, ' ')
                      }}</v-chip>
                      <span class="gap-module-tag">{{ gap.module_name }}</span>
                    </div>
                    <div class="gap-card-actions">
                      <v-select
                        :model-value="gap.status"
                        :items="['open', 'in_progress', 'completed', 'overdue']"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="max-width: 140px; font-size: 12px"
                        @update:model-value="(v) => updateGap(gap.id, { status: v })"
                      />
                    </div>
                  </div>
                  <p class="gap-title">{{ gap.title }}</p>
                  <p class="gap-desc">{{ gap.description }}</p>

                  <div class="gap-question-box" v-if="gap.question_text">
                    <span class="gap-q-label">Question {{ gap.question_ref }}</span>
                    <p class="gap-q-text">{{ gap.question_text }}</p>
                    <div class="gap-response-row">
                      <span class="gap-resp-label">Response:</span>
                      <v-chip :color="responseColor(gap.response)" size="x-small" variant="flat">
                        {{ gap.response?.toUpperCase() ?? 'NO RESPONSE' }}
                      </v-chip>
                    </div>
                  </div>

                  <div class="gap-remediation" v-if="gap.remediation_action">
                    <font-awesome-icon
                      icon="fa-solid fa-lightbulb"
                      class="mr-2"
                      style="color: #7c3aed"
                    />
                    <span>{{ gap.remediation_action }}</span>
                  </div>

                  <div class="gap-footer">
                    <div class="d-flex align-center gap-3 flex-wrap">
                      <div class="d-flex align-center gap-2">
                        <font-awesome-icon
                          icon="fa-solid fa-user"
                          class="text-slate-400"
                          style="font-size: 11px"
                        />
                        <v-select
                          :model-value="gap.assigned_to"
                          :items="staff"
                          item-title="full_name"
                          item-value="id"
                          density="compact"
                          variant="plain"
                          hide-details
                          placeholder="Assign to…"
                          style="max-width: 180px; font-size: 12px"
                          @update:model-value="(v) => updateGap(gap.id, { assigned_to: v })"
                        />
                      </div>
                      <div class="d-flex align-center gap-2">
                        <font-awesome-icon
                          icon="fa-regular fa-calendar"
                          class="text-slate-400"
                          style="font-size: 11px"
                        />
                        <input
                          type="date"
                          class="date-input"
                          :value="gap.due_date"
                          @change="
                            (e) =>
                              updateGap(gap.id, { due_date: (e.target as HTMLInputElement).value })
                          "
                        />
                      </div>
                    </div>
                    <div v-if="gap.evidence_required" class="gap-evidence-tag">
                      <font-awesome-icon icon="fa-solid fa-paperclip" class="mr-1" />Evidence
                      required
                    </div>
                  </div>
                </div>
              </div>

              <!-- ════════════════════════════════════════════
                   TAB: QUESTIONS
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'questions'">
                <div class="arp-section-toolbar">
                  <v-select
                    v-model="qModuleFilter"
                    :items="['All Modules', ...moduleScores.map((m: any) => m.module_name)]"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 220px"
                    label="Module"
                  />
                  <v-select
                    v-model="qResponseFilter"
                    :items="['all', 'yes', 'no', 'na', 'unanswered']"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 160px"
                    label="Response"
                  />
                </div>

                <!-- Group by module -->
                <div
                  v-for="mod in filteredModuleGroups"
                  :key="mod.module_code"
                  class="q-module-group"
                >
                  <div class="q-module-header">
                    <div class="q-module-badge">{{ mod.module_code }}</div>
                    <span class="q-module-name">{{ mod.module_name }}</span>
                    <div
                      class="q-module-score-pill"
                      :style="{
                        color: scoreBarColor(mod.module_score),
                        background: scoreBarColor(mod.module_score) + '18'
                      }"
                    >
                      {{ Math.round(mod.module_score ?? 0) }}%
                    </div>
                  </div>

                  <div
                    v-for="q in mod.questions"
                    :key="q.question_id"
                    class="q-row"
                    :class="`q-resp-${q.response ?? 'unanswered'}`"
                  >
                    <div
                      class="q-resp-indicator"
                      :style="{ background: responseColor(q.response) }"
                    />
                    <div class="q-content">
                      <div class="q-head-row">
                        <code class="ref-code">{{ q.question_ref }}</code>
                        <v-chip
                          :color="responseColor(q.response)"
                          size="x-small"
                          variant="flat"
                          class="font-weight-bold"
                        >
                          {{ q.response?.toUpperCase() ?? 'UNANSWERED' }}
                        </v-chip>
                        <span class="q-points">{{ q.points }} pts</span>
                        <v-chip v-if="q.has_gap" size="x-small" color="error" variant="tonal"
                          >Gap</v-chip
                        >
                      </div>
                      <p class="q-text">{{ q.question_text }}</p>
                      <div v-if="q.response === 'no' && q.remediation_action" class="q-remediation">
                        <font-awesome-icon
                          icon="fa-solid fa-arrow-right"
                          class="mr-1"
                          style="color: #7c3aed; font-size: 10px"
                        />
                        {{ q.remediation_action }}
                      </div>
                      <p v-if="q.response_notes" class="q-notes">
                        <font-awesome-icon icon="fa-regular fa-comment-dots" class="mr-1" />{{
                          q.response_notes
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ════════════════════════════════════════════
                   TAB: FINDINGS
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'findings'">
                <div class="arp-section-toolbar">
                  <v-btn
                    color="primary"
                    size="small"
                    variant="tonal"
                    @click="showAddFinding = true"
                  >
                    <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />Add Finding
                  </v-btn>
                </div>

                <div v-if="!d.findings?.length" class="arp-empty">No findings recorded yet.</div>

                <div v-for="f in d.findings" :key="f.id" class="finding-card">
                  <div class="finding-head">
                    <div class="d-flex align-center gap-2">
                      <code class="ref-code">{{ f.finding_ref }}</code>
                      <v-chip
                        :color="riskChipColor(f.severity)"
                        size="x-small"
                        variant="flat"
                        class="text-uppercase font-weight-bold"
                        >{{ f.severity }}</v-chip
                      >
                      <v-chip
                        :color="f.is_resolved ? 'success' : 'error'"
                        size="x-small"
                        variant="tonal"
                        >{{ f.is_resolved ? 'Resolved' : 'Open' }}</v-chip
                      >
                    </div>
                    <div class="d-flex align-center gap-2 text-xs text-slate-400">
                      <font-awesome-icon icon="fa-solid fa-user-pen" />
                      {{ f.creator_name ?? '—' }} · {{ fmtDate(f.created_at) }}
                    </div>
                  </div>
                  <p class="finding-title">{{ f.title }}</p>
                  <p class="finding-desc">{{ f.description }}</p>
                  <div v-if="f.recommendation" class="finding-rec">
                    <font-awesome-icon
                      icon="fa-solid fa-lightbulb"
                      class="mr-2"
                      style="color: #7c3aed"
                    />
                    {{ f.recommendation }}
                  </div>
                  <div class="finding-footer">
                    <span class="text-xs text-slate-400"
                      ><font-awesome-icon icon="fa-solid fa-list-check" class="mr-1" />{{
                        f.action_count
                      }}
                      action{{ f.action_count !== 1 ? 's' : '' }}</span
                    >
                    <v-btn size="x-small" color="primary" variant="tonal" @click="openAddAction(f)">
                      <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />Add Action
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- ════════════════════════════════════════════
                   TAB: ACTIONS
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'actions'">
                <div v-if="!d.actions?.length" class="arp-empty">No action plans yet.</div>
                <div v-for="a in d.actions" :key="a.id" class="action-card">
                  <div class="action-dot" :style="{ background: actionStatusColor(a.status) }" />
                  <div class="action-body">
                    <div class="d-flex align-center gap-2 mb-1">
                      <code class="ref-code">{{ a.action_ref }}</code>
                      <v-chip :color="actionStatusColor(a.status)" size="x-small" variant="tonal">{{
                        a.status?.replace(/_/g, ' ')
                      }}</v-chip>
                      <span class="text-xs text-slate-400">re: {{ a.finding_ref }}</span>
                    </div>
                    <p class="action-desc">{{ a.description }}</p>
                    <div class="action-footer">
                      <span v-if="a.assignee_name" class="action-meta"
                        ><font-awesome-icon icon="fa-solid fa-user" class="mr-1" />{{
                          a.assignee_name
                        }}</span
                      >
                      <span
                        v-if="a.due_date"
                        class="action-meta"
                        :class="{ overdue: isOverdue(a.due_date, a.status) }"
                      >
                        <font-awesome-icon icon="fa-regular fa-calendar" class="mr-1" />{{
                          fmtDate(a.due_date)
                        }}
                      </span>
                      <span v-if="a.completed_at" class="action-meta text-green-600">
                        <font-awesome-icon icon="fa-solid fa-check" class="mr-1" />{{
                          fmtDate(a.completed_at)
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ════════════════════════════════════════════
                   TAB: REVIEW NOTES (admin publish workflow)
                   ════════════════════════════════════════════ -->
              <div v-show="innerTab === 'review'">
                <div class="ch-card">
                  <div class="ch-card-head">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" style="color: #7c3aed" />
                    <span class="ch-card-title">Review Notes</span>
                    <span class="ch-card-sub admin-badge">Admin Only</span>
                  </div>
                  <div class="ch-card-body">
                    <div v-if="d.reviewer" class="reviewer-pill mb-4">
                      <font-awesome-icon icon="fa-solid fa-user-shield" class="mr-2" />
                      Last reviewed by <strong>{{ d.reviewer.full_name }}</strong>
                      <span v-if="d.reviewed_at"> on {{ fmtDate(d.reviewed_at) }}</span>
                    </div>

                    <v-textarea
                      v-model="reviewNotes"
                      label="Internal review notes (visible to admins only)"
                      variant="outlined"
                      rows="5"
                      auto-grow
                      placeholder="Document your findings, risk assessment, and rationale for publication decision…"
                    />

                    <div class="mt-4 d-flex gap-3 flex-wrap">
                      <v-btn
                        v-if="d.status === 'under_review'"
                        color="success"
                        variant="flat"
                        :loading="actionLoading.publish"
                        @click="handlePublish"
                      >
                        <font-awesome-icon icon="fa-solid fa-globe" class="mr-2" />Publish
                        Assessment
                      </v-btn>
                      <v-btn
                        v-if="['completed', 'in_progress'].includes(d.status)"
                        color="warning"
                        variant="tonal"
                        :loading="actionLoading.flag"
                        @click="handleFlagReview"
                      >
                        <font-awesome-icon icon="fa-solid fa-flag" class="mr-2" />Flag for Review
                      </v-btn>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        :loading="actionLoading.saveNotes"
                        @click="saveReviewNotes"
                      >
                        <font-awesome-icon icon="fa-solid fa-floppy-disk" class="mr-2" />Save Notes
                      </v-btn>
                    </div>
                  </div>
                </div>

                <!-- Score adjustment here too -->
                <div class="ch-card mt-4 admin-only-card">
                  <div class="ch-card-head">
                    <font-awesome-icon icon="fa-solid fa-sliders" style="color: #7c3aed" />
                    <span class="ch-card-title">Score Adjustment Log</span>
                  </div>
                  <div class="ch-card-body">
                    <div class="d-flex gap-3 align-end flex-wrap mb-4">
                      <v-text-field
                        v-model.number="scoreAdj.points"
                        label="Points"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 120px"
                      />
                      <v-text-field
                        v-model="scoreAdj.reason"
                        label="Reason for adjustment"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 320px"
                      />
                      <v-btn
                        color="purple"
                        variant="tonal"
                        size="small"
                        :loading="actionLoading.scoreAdj"
                        :disabled="!scoreAdj.reason || scoreAdj.points === 0"
                        @click="applyScoreAdjustment"
                      >
                        Apply
                      </v-btn>
                    </div>
                    <p class="text-sm text-slate-500">
                      Total adjustments applied: <strong>{{ d.score_adjustments ?? 0 }} pts</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <!-- /arp-tab-body -->
          </div>
          <!-- /arp-body -->
        </div>
        <!-- /arp-panel -->
      </div>
    </Transition>
  </Teleport>

  <!-- ── Add Finding Dialog ───────────────────────── -->
  <v-dialog v-model="showAddFinding" max-width="480" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3">Add Finding</v-card-title>
      <v-card-text class="pa-5 pt-0">
        <v-text-field
          v-model="newFinding.title"
          label="Title"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-textarea
          v-model="newFinding.description"
          label="Description"
          variant="outlined"
          density="comfortable"
          rows="3"
          class="mb-3"
        />
        <v-select
          v-model="newFinding.severity"
          :items="['critical', 'high', 'medium', 'low']"
          label="Severity"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-textarea
          v-model="newFinding.recommendation"
          label="Recommendation (optional)"
          variant="outlined"
          density="comfortable"
          rows="2"
        />
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-btn variant="text" @click="showAddFinding = false">Cancel</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :loading="actionLoading.finding"
          @click="submitFinding"
          >Add Finding</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── Add Action Dialog ────────────────────────── -->
  <v-dialog v-model="showAddAction" max-width="480" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3">Add Action — {{ selectedFinding?.finding_ref }}</v-card-title>
      <v-card-text class="pa-5 pt-0">
        <v-textarea
          v-model="newAction.description"
          label="Action Description"
          variant="outlined"
          density="comfortable"
          rows="3"
          class="mb-3"
        />
        <v-autocomplete
          v-model="newAction.assigned_to"
          :items="staff"
          item-title="full_name"
          item-value="id"
          label="Assign to"
          variant="outlined"
          density="comfortable"
          clearable
          class="mb-3"
        />
        <v-text-field
          v-model="newAction.due_date"
          type="date"
          label="Due Date"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-textarea
          v-model="newAction.notes"
          label="Notes (optional)"
          variant="outlined"
          density="comfortable"
          rows="2"
        />
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-btn variant="text" @click="showAddAction = false">Cancel</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" :loading="actionLoading.action" @click="submitAction"
          >Add Action</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar -->
  <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
    {{ snack.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { supabase } from '@/services/supabase'

const props = defineProps<{
  modelValue: boolean
  assessmentId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'published'): void
  (e: 'updated'): void
}>()

// ── State ─────────────────────────────────────────────────
const loading = ref(false)
const d = ref<any>(null)
const staff = ref<any[]>([])
const innerTab = ref('dashboard')
const gapFilter = ref('all')
const gapStatusFilter = ref('all')
const qModuleFilter = ref('All Modules')
const qResponseFilter = ref('all')
const reviewNotes = ref('')
const scoreAdj = ref({ points: 0, reason: '' })
const showAddFinding = ref(false)
const showAddAction = ref(false)
const selectedFinding = ref<any>(null)
const newFinding = ref({ title: '', description: '', severity: 'medium', recommendation: '' })
const newAction = ref({
  description: '',
  assigned_to: null as string | null,
  due_date: '',
  notes: ''
})
const actionLoading = ref({
  publish: false,
  flag: false,
  saveNotes: false,
  finding: false,
  action: false,
  scoreAdj: false
})
const snack = ref({ show: false, message: '', color: 'success' })

// ── Inner tabs ────────────────────────────────────────────
const innerTabs = computed(() => [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', count: 0 },
  {
    key: 'gaps',
    label: 'Gaps',
    icon: 'fa-solid fa-triangle-exclamation',
    count: d.value?.gap_summary?.open ?? 0
  },
  { key: 'questions', label: 'Questions', icon: 'fa-solid fa-circle-question', count: 0 },
  {
    key: 'findings',
    label: 'Findings',
    icon: 'fa-solid fa-magnifying-glass',
    count: d.value?.findings?.length ?? 0
  },
  {
    key: 'actions',
    label: 'Actions',
    icon: 'fa-solid fa-list-check',
    count: d.value?.actions?.length ?? 0
  },
  { key: 'review', label: 'Review', icon: 'fa-solid fa-pen-to-square', count: 0 }
])

// ── Load data ─────────────────────────────────────────────
watch(
  () => [props.modelValue, props.assessmentId],
  async ([open, id]) => {
    if (!open || !id) {
      d.value = null
      return
    }
    await Promise.all([loadAssessment(id as string), loadStaff()])
    innerTab.value = 'dashboard'
  },
  { immediate: true }
)

async function loadAssessment(id: string) {
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('get_assessment_review_admin', {
      p_assessment_id: id
    })
    if (error) throw error
    d.value = data
    reviewNotes.value = data.review_notes ?? ''
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function loadStaff() {
  const { data } = await supabase.rpc('get_admin_staff')
  staff.value = data ?? []
}

function close() {
  emit('update:modelValue', false)
}

// ── Derived ───────────────────────────────────────────────
const moduleScores = computed<any[]>(() => d.value?.module_scores ?? [])
const gapSummary = computed(() => d.value?.gap_summary ?? {})
const responseStats = computed(() => d.value?.response_stats ?? {})
const healthScore = computed(() => Math.round(d.value?.health_score ?? 0))
const healthRating = computed(() => d.value?.health_rating ?? 'needs_improvement')

const ratingConfig: Record<string, any> = {
  excellent: { label: 'Excellent', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  healthy: { label: 'Healthy', color: '#65a30d', bg: '#f7fee7', border: '#d9f99d' },
  satisfactory: { label: 'Satisfactory', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  needs_improvement: {
    label: 'Needs Improvement',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa'
  },
  at_risk: { label: 'At Risk', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  critical: { label: 'Critical', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' }
}
const rating = computed(() => ratingConfig[healthRating.value] ?? ratingConfig.needs_improvement)

const gaugeColor = computed(() => {
  const s = healthScore.value
  if (s >= 90) return '#16a34a'
  if (s >= 75) return '#65a30d'
  if (s >= 60) return '#d97706'
  if (s >= 45) return '#ea580c'
  if (s >= 30) return '#dc2626'
  return '#991b1b'
})

const ratingScale = [
  { range: '90–100', label: 'Excellent', color: '#16a34a' },
  { range: '75–89', label: 'Healthy', color: '#65a30d' },
  { range: '60–74', label: 'Satisfactory', color: '#d97706' },
  { range: '45–59', label: 'Needs Work', color: '#ea580c' },
  { range: '<45', label: 'At Risk', color: '#dc2626' }
]

// ── Filtered gaps ─────────────────────────────────────────
const filteredGaps = computed(() => {
  return (d.value?.gaps ?? []).filter((g: any) => {
    const ratingOk = gapFilter.value === 'all' || g.risk_rating === gapFilter.value
    const statusOk = gapStatusFilter.value === 'all' || g.status === gapStatusFilter.value
    return ratingOk && statusOk
  })
})

// ── Filtered question groups ──────────────────────────────
const filteredModuleGroups = computed(() => {
  const responses: any[] = d.value?.responses ?? []
  const grouped: Record<string, any> = {}

  for (const q of responses) {
    if (qModuleFilter.value !== 'All Modules' && q.module_name !== qModuleFilter.value) continue
    if (qResponseFilter.value !== 'all') {
      const resp = q.response ?? 'unanswered'
      if (resp !== qResponseFilter.value) continue
    }
    if (!grouped[q.module_code]) {
      const ms = moduleScores.value.find((m: any) => m.module_code === q.module_code)
      grouped[q.module_code] = {
        module_code: q.module_code,
        module_name: q.module_name,
        module_score: ms?.module_score ?? 0,
        questions: []
      }
    }
    grouped[q.module_code].questions.push(q)
  }
  return Object.values(grouped)
})

// ── ApexCharts ────────────────────────────────────────────
const radialOptions = computed(() => ({
  chart: { type: 'radialBar', sparkline: { enabled: true } },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: { size: '62%' },
      track: { background: '#e2e8f0', strokeWidth: '100%' },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '34px',
          fontWeight: 800,
          fontFamily: 'Inter,sans-serif',
          color: gaugeColor.value,
          formatter: (v: number) => `${Math.round(v)}`
        }
      }
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      gradientToColors: [gaugeColor.value],
      stops: [0, 100]
    }
  },
  colors: [gaugeColor.value],
  stroke: { lineCap: 'round' }
}))
const radialSeries = computed(() => [healthScore.value])

const radarOptions = computed(() => ({
  chart: { type: 'radar', fontFamily: 'Inter,sans-serif', toolbar: { show: false } },
  xaxis: {
    categories: moduleScores.value.map((m: any) =>
      m.module_name.length > 14 ? m.module_name.slice(0, 14) + '…' : m.module_name
    )
  },
  yaxis: { show: false, max: 100 },
  fill: { opacity: 0.15, colors: ['#3b82f6'] },
  stroke: { width: 2, colors: ['#3b82f6'] },
  markers: { size: 4, colors: ['#3b82f6'], strokeColors: '#fff', strokeWidth: 2 },
  plotOptions: {
    radar: { polygons: { strokeColors: '#e2e8f0', fill: { colors: ['#f8fafc', '#ffffff'] } } }
  },
  tooltip: { y: { formatter: (v: number) => `${Math.round(v)}%` } },
  dataLabels: { enabled: false }
}))
const radarSeries = computed(() => [
  { name: 'Score', data: moduleScores.value.map((m: any) => Math.round(m.module_score ?? 0)) }
])

const moduleBarOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter,sans-serif' },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      distributed: true,
      barHeight: '62%',
      dataLabels: { position: 'right' }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (v: number) => `${Math.round(v)}%`,
    style: { fontSize: '11px', fontWeight: 700, colors: ['#334155'] },
    offsetX: 8
  },
  colors: moduleScores.value.map((m: any) => scoreBarColor(m.module_score)),
  xaxis: {
    categories: moduleScores.value.map((m: any) => m.module_name),
    max: 100,
    labels: { formatter: (v: number) => `${v}%`, style: { fontSize: '11px', colors: '#94a3b8' } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#334155' }, maxWidth: 160 }
  },
  grid: {
    borderColor: '#f1f5f9',
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } }
  },
  legend: { show: false },
  tooltip: { y: { formatter: (v: number) => `${Math.round(v)}%` } }
}))
const moduleBarSeries = computed(() => [
  { name: 'Score', data: moduleScores.value.map((m: any) => Math.round(m.module_score ?? 0)) }
])

const gapDonutOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'Inter,sans-serif' },
  labels: ['Critical', 'High', 'Medium', 'Low'],
  colors: ['#dc2626', '#ea580c', '#f59e0b', '#84cc16'],
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Open Gaps',
            fontSize: '12px',
            color: '#64748b',
            fontFamily: 'Inter,sans-serif',
            formatter: () => String(gapSummary.value.open ?? 0)
          },
          value: {
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Inter,sans-serif',
            color: '#0f172a'
          }
        }
      }
    }
  },
  dataLabels: { enabled: false },
  legend: { position: 'bottom', fontSize: '12px', fontFamily: 'Inter,sans-serif' },
  stroke: { width: 2, colors: ['#ffffff'] }
}))
const gapDonutSeries = computed(() => [
  gapSummary.value.critical ?? 0,
  gapSummary.value.high ?? 0,
  gapSummary.value.medium ?? 0,
  gapSummary.value.low ?? 0
])

const responseDonutOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'Inter,sans-serif' },
  labels: ['Compliant', 'Gaps', 'N/A', 'Unanswered'],
  colors: ['#22c55e', '#ef4444', '#94a3b8', '#e2e8f0'],
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Questions',
            fontSize: '12px',
            color: '#64748b',
            fontFamily: 'Inter,sans-serif',
            formatter: () =>
              String(
                (responseStats.value.yes ?? 0) +
                  (responseStats.value.no ?? 0) +
                  (responseStats.value.na ?? 0) +
                  (responseStats.value.unanswered ?? 0)
              )
          },
          value: {
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Inter,sans-serif',
            color: '#0f172a'
          }
        }
      }
    }
  },
  dataLabels: { enabled: false },
  legend: { position: 'bottom', fontSize: '12px', fontFamily: 'Inter,sans-serif' },
  stroke: { width: 2, colors: ['#ffffff'] }
}))
const responseDonutSeries = computed(() => [
  responseStats.value.yes ?? 0,
  responseStats.value.no ?? 0,
  responseStats.value.na ?? 0,
  responseStats.value.unanswered ?? 0
])

// ── Admin actions ─────────────────────────────────────────
async function handlePublish() {
  actionLoading.value.publish = true
  try {
    const { data, error } = await supabase.rpc('publish_assessment', {
      p_assessment_id: props.assessmentId,
      p_review_notes: reviewNotes.value || null
    })
    if (error) throw error
    showSnack('Assessment published successfully', 'success')
    emit('published')
    close()
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.publish = false
  }
}

function openPublish() {
  innerTab.value = 'review'
}
function openFlagReview() {
  innerTab.value = 'review'
}

async function handleFlagReview() {
  actionLoading.value.flag = true
  try {
    const { error } = await supabase.rpc('update_assessment_status', {
      p_assessment_id: props.assessmentId,
      p_status: 'under_review',
      p_review_notes: reviewNotes.value || null
    })
    if (error) throw error
    showSnack('Flagged for review', 'success')
    emit('updated')
    await loadAssessment(props.assessmentId!)
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.flag = false
  }
}

async function saveReviewNotes() {
  actionLoading.value.saveNotes = true
  try {
    const { error } = await supabase.rpc('update_assessment_status', {
      p_assessment_id: props.assessmentId,
      p_status: d.value.status,
      p_review_notes: reviewNotes.value
    })
    if (error) throw error
    showSnack('Notes saved', 'success')
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.saveNotes = false
  }
}

async function applyScoreAdjustment() {
  if (!scoreAdj.value.reason || scoreAdj.value.points === 0) return
  actionLoading.value.scoreAdj = true
  try {
    const { error } = await supabase.rpc('admin_adjust_score', {
      p_assessment_id: props.assessmentId,
      p_adjustment: scoreAdj.value.points,
      p_reason: scoreAdj.value.reason,
      p_client_id: d.value.client.id
    })
    if (error) throw error
    showSnack(
      `Score adjusted by ${scoreAdj.value.points > 0 ? '+' : ''}${scoreAdj.value.points} pts`,
      'success'
    )
    scoreAdj.value = { points: 0, reason: '' }
    await loadAssessment(props.assessmentId!)
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.scoreAdj = false
  }
}

async function updateGap(gapId: string, patch: Record<string, any>) {
  try {
    const { error } = await supabase.rpc('admin_update_gap', {
      p_gap_id: gapId,
      p_status: patch.status ?? null,
      p_assigned_to: patch.assigned_to ?? null,
      p_due_date: patch.due_date ?? null,
      p_notes: patch.notes ?? null
    })
    if (error) throw error
    showSnack('Gap updated', 'success')
    await loadAssessment(props.assessmentId!)
  } catch (e: any) {
    showSnack(e.message, 'error')
  }
}

function openAddAction(finding: any) {
  selectedFinding.value = finding
  newAction.value = { description: '', assigned_to: null, due_date: '', notes: '' }
  showAddAction.value = true
}

async function submitFinding() {
  actionLoading.value.finding = true
  try {
    const { error } = await supabase.rpc('admin_add_finding', {
      p_client_id: d.value.client.id,
      p_engagement_id: d.value.engagement?.id ?? null,
      p_title: newFinding.value.title,
      p_description: newFinding.value.description,
      p_severity: newFinding.value.severity,
      p_recommendation: newFinding.value.recommendation || null
    })
    if (error) throw error
    showSnack('Finding added', 'success')
    showAddFinding.value = false
    newFinding.value = { title: '', description: '', severity: 'medium', recommendation: '' }
    await loadAssessment(props.assessmentId!)
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.finding = false
  }
}

async function submitAction() {
  actionLoading.value.action = true
  try {
    const { error } = await supabase.rpc('admin_add_action', {
      p_finding_id: selectedFinding.value.id,
      p_client_id: d.value.client.id,
      p_description: newAction.value.description,
      p_assigned_to: newAction.value.assigned_to || null,
      p_due_date: newAction.value.due_date || null,
      p_notes: newAction.value.notes || null
    })
    if (error) throw error
    showSnack('Action added', 'success')
    showAddAction.value = false
    await loadAssessment(props.assessmentId!)
  } catch (e: any) {
    showSnack(e.message, 'error')
  } finally {
    actionLoading.value.action = false
  }
}

// ── Helpers ───────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
function fmtStatus(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'
}
function scoreBarColor(score: number) {
  if (score >= 75) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}
function moduleRatingLabel(score: number) {
  if (score >= 90) return { label: 'Excellent', color: '#16a34a', bg: '#f0fdf4' }
  if (score >= 75) return { label: 'Healthy', color: '#65a30d', bg: '#f7fee7' }
  if (score >= 60) return { label: 'Satisfactory', color: '#d97706', bg: '#fffbeb' }
  if (score >= 45) return { label: 'Needs Work', color: '#ea580c', bg: '#fff7ed' }
  return { label: 'At Risk', color: '#dc2626', bg: '#fef2f2' }
}
function riskColor(r: string) {
  return { critical: '#B71C1C', high: '#E53935', medium: '#FB8C00', low: '#43A047' }[r] ?? '#9E9E9E'
}
function riskChipColor(r: string) {
  return (
    { critical: 'deep-orange-darken-3', high: 'error', medium: 'warning', low: 'success' }[r] ??
    'grey'
  )
}
function gapStatusColor(s: string) {
  return (
    { open: 'error', in_progress: 'warning', completed: 'success', overdue: 'deep-orange' }[s] ??
    'grey'
  )
}
function responseColor(r: string | null) {
  return { yes: '#22c55e', no: '#ef4444', na: '#94a3b8' }[r ?? ''] ?? '#cbd5e1'
}
function actionStatusColor(s: string) {
  return (
    {
      open: '#E53935',
      in_progress: '#FB8C00',
      completed: '#43A047',
      overdue: '#B71C1C',
      cancelled: '#9E9E9E'
    }[s] ?? '#9E9E9E'
  )
}
function statusPillStyle(s: string) {
  const map: Record<string, any> = {
    completed: { background: '#dcfce7', color: '#16a34a' },
    under_review: { background: '#fef9c3', color: '#ca8a04' },
    published: { background: '#d1fae5', color: '#059669' },
    in_progress: { background: '#dbeafe', color: '#2563eb' }
  }
  return map[s] ?? { background: '#f1f5f9', color: '#64748b' }
}
function isOverdue(date: string, status: string) {
  if (status === 'completed') return false
  return new Date(date) < new Date()
}
function showSnack(message: string, color: 'success' | 'error') {
  snack.value = { show: true, message, color }
}
</script>

<style scoped>
/* ── Panel overlay + slide ── */
.arp-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}
.arp-panel {
  width: min(92vw, 1100px);
  height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.18);
}
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(60px);
}

/* ── Header ── */
.arp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  gap: 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}
.arp-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.arp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.arp-back-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #334155;
  color: #94a3b8;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s;
}
.arp-back-btn:hover {
  background: #475569;
  color: #fff;
}
.arp-eyebrow {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
}
.arp-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
  margin: 2px 0;
}
.arp-meta {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  gap: 6px;
  align-items: center;
}
.arp-dot {
  opacity: 0.4;
}
.capitalize {
  text-transform: capitalize;
}
.arp-status-pill {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

/* ── Inner tabs ── */
.arp-tabs {
  display: flex;
  gap: 0;
  padding: 0 24px;
  background: #fff;
  border-bottom: 2px solid #e2e8f0;
  flex-shrink: 0;
  overflow-x: auto;
}
.arp-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: all 0.15s;
}
.arp-tab:hover {
  color: #2563eb;
  background: #f8fafc;
}
.arp-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: transparent;
}
.arp-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

/* ── Body ── */
.arp-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: #64748b;
  font-size: 0.875rem;
}
.arp-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.arp-tab-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.arp-empty {
  text-align: center;
  padding: 60px 0;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* ── Dashboard styles (mirror client dashboard) ── */
.ch-kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 4px;
}
.ch-kpi-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ch-kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.ch-kpi-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: 'Inter', sans-serif;
}
.ch-kpi-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

.ch-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 720px) {
  .ch-grid-2 {
    grid-template-columns: 1fr;
  }
}
.mt-5 {
  margin-top: 16px;
}

.ch-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}
.admin-only-card {
  border-color: #e9d5ff;
  background: #faf5ff;
}
.ch-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}
.ch-card-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}
.ch-card-sub {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-left: 4px;
}
.admin-badge {
  background: #ede9fe;
  color: #7c3aed;
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 700;
  font-size: 0.65rem;
}
.ch-card-body {
  padding: 16px 18px;
}
.ch-gauge-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ch-gauge-meta {
  text-align: center;
  margin-top: -8px;
}
.ch-rating-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 99px;
  border: 1px solid;
  font-size: 0.8rem;
  font-weight: 700;
}
.ch-gauge-hint {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 6px;
}
.ch-scale {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  width: 100%;
}
.ch-scale-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ch-scale-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ch-scale-range {
  font-size: 0.68rem;
  color: #64748b;
  width: 48px;
}
.ch-scale-label {
  font-size: 0.68rem;
  color: #334155;
  font-weight: 600;
}
.ch-chart-empty {
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 40px;
  text-align: center;
}

.ch-table-wrap {
  overflow-x: auto;
}
.ch-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.ch-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}
.ch-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}
.ch-table tr:last-child td {
  border-bottom: none;
}
.ch-th-bar {
  min-width: 140px;
}
.ch-td-bar {
  min-width: 140px;
}
.ch-mod-name {
  font-weight: 600;
  color: #1e293b;
}
.ch-mod-desc {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}
.ch-score-num {
  font-weight: 800;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
}
.ch-bar-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}
.ch-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s;
}
.ch-weight-pill {
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
}
.ch-mod-rating {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
}

.ch-gap-pills {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 12px;
  flex-wrap: wrap;
}
.ch-gap-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.68rem;
  font-weight: 600;
  gap: 2px;
}
.ch-gap-pill.critical {
  background: #fef2f2;
  color: #dc2626;
}
.ch-gap-pill.high {
  background: #fff7ed;
  color: #ea580c;
}
.ch-gap-pill.medium {
  background: #fffbeb;
  color: #d97706;
}
.ch-gap-pill.low {
  background: #f0fdf4;
  color: #16a34a;
}
.ch-gap-pill-val {
  font-size: 1.25rem;
  font-weight: 800;
}

.ch-resp-stats {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ch-resp-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #475569;
}
.ch-resp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ch-resp-val {
  margin-left: auto;
  font-weight: 700;
  color: #1e293b;
}

/* ── Gap cards ── */
.arp-section-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.gap-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.gap-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.gap-card-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.gap-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gap-title {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1e293b;
  margin: 0 0 4px;
}
.gap-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0 0 10px;
}
.gap-module-tag {
  font-size: 0.68rem;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 600;
}
.gap-question-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.gap-q-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.gap-q-text {
  font-size: 0.78rem;
  color: #334155;
  margin: 4px 0 6px;
}
.gap-response-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
}
.gap-resp-label {
  color: #94a3b8;
  font-weight: 600;
}
.gap-remediation {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 0.78rem;
  color: #374151;
}
.gap-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.gap-evidence-tag {
  font-size: 0.68rem;
  background: #fffbeb;
  color: #d97706;
  padding: 3px 10px;
  border-radius: 99px;
  font-weight: 600;
}
.date-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
  color: #475569;
  outline: none;
}
.date-input:focus {
  border-color: #93c5fd;
}

/* ── Question groups ── */
.q-module-group {
  margin-bottom: 20px;
}
.q-module-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 10px;
  margin-bottom: 6px;
}
.q-module-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: #1e293b;
  color: #fff;
  padding: 3px 8px;
  border-radius: 6px;
}
.q-module-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
}
.q-module-score-pill {
  font-size: 0.8rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 99px;
}
.q-row {
  display: flex;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 6px;
}
.q-resp-indicator {
  width: 4px;
  border-radius: 99px;
  flex-shrink: 0;
  min-height: 40px;
}
.q-content {
  flex: 1;
  min-width: 0;
}
.q-head-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.q-text {
  font-size: 0.82rem;
  color: #334155;
  margin: 0 0 6px;
}
.q-points {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}
.q-remediation {
  font-size: 0.75rem;
  color: #7c3aed;
  background: #faf5ff;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
}
.q-notes {
  font-size: 0.72rem;
  color: #64748b;
  margin: 0;
  font-style: italic;
}

/* ── Finding cards ── */
.finding-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.finding-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 6px;
}
.finding-title {
  font-weight: 700;
  font-size: 0.875rem;
  color: #1e293b;
  margin: 0 0 4px;
}
.finding-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0 0 8px;
}
.finding-rec {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.78rem;
  color: #374151;
  margin-bottom: 10px;
}
.finding-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

/* ── Action cards ── */
.action-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 8px;
}
.action-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.action-body {
  flex: 1;
}
.action-desc {
  font-size: 0.82rem;
  color: #334155;
  margin: 0 0 8px;
}
.action-footer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.action-meta {
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  align-items: center;
}
.action-meta.overdue {
  color: #dc2626;
}

/* ── Review section ── */
.reviewer-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.78rem;
  color: #475569;
}

/* ── ref code ── */
.ref-code {
  font-size: 0.68rem;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #475569;
}
</style>
