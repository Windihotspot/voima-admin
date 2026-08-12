<template>
    <main-layout>
        <div class="sop-library">
    <!-- Header -->
    <div class="sop-header">
      <div class="sop-header-content">
        <h1 class="sop-title">Standard Operating Procedure (SOP)</h1>
        <p class="sop-subtitle">Manage and organize Standard Operating Procedures</p>
      </div>
      <button
        v-if="!showCreateForm"
        @click="showCreateForm = true"
        class="btn-primary"
      >
        <i class="mdi mdi-plus"></i>
        New SOP
      </button>
    </div>

    <!-- Create/Edit SOP Form -->
    <transition name="slide">
      <div v-if="showCreateForm" class="sop-form-container">
        <div class="sop-form">
          <div class="form-header">
            <h2>{{ editingId ? 'Edit SOP' : 'Create New SOP' }}</h2>
            <button @click="closeForm" class="btn-close">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="form-content">
            <!-- Title -->
            <div class="form-group">
              <label>Title *</label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="Enter SOP title"
                class="input-field"
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea
                v-model="formData.description"
                placeholder="Enter SOP description"
                class="textarea-field"
                rows="4"
              ></textarea>
            </div>

            <!-- Category and Version -->
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <input
                  v-model="formData.category"
                  type="text"
                  placeholder="e.g., HR, Compliance, IT"
                  class="input-field"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  <option v-for="cat in categories" :key="cat" :value="cat" />
                </datalist>
              </div>

              <div class="form-group">
                <label>Version</label>
                <input
                  v-model="formData.version"
                  type="text"
                  placeholder="1.0"
                  class="input-field"
                />
              </div>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status" class="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button @click="closeForm" class="btn-secondary">
                Cancel
              </button>
              <button
                @click="saveSop"
                :disabled="!formData.title || loading"
                class="btn-primary"
              >
                <i v-if="loading" class="mdi mdi-loading"></i>
                {{ editingId ? 'Update SOP' : 'Create SOP' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Filters and Search -->
    <div class="sop-toolbar">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search SOPs..."
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <select v-model="filterCategory" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>

    <!-- Loading and Error States -->
    <div v-if="error" class="alert alert-error">
      <i class="mdi mdi-alert-circle"></i>
      {{ error }}
    </div>

    <!-- SOPs List -->
    <div v-if="loading && filteredSops.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading SOPs...</p>
    </div>

    <div v-else-if="filteredSops.length === 0" class="empty-state">
      <i class="mdi mdi-folder-open-outline"></i>
      <h3>No SOPs Found</h3>
      <p>{{ searchQuery || filterCategory || filterStatus ? 'Try adjusting your filters' : 'Create your first SOP to get started' }}</p>
    </div>

    <div v-else class="sop-grid">
      <div
        v-for="sop in filteredSops"
        :key="sop.id"
        class="sop-card"
        @click="selectSop(sop)"
        :class="{ active: selectedSopId === sop.id }"
      >
        <div class="card-header">
          <h3 class="card-title">{{ sop.title }}</h3>
          <div class="card-actions">
            <button
              @click.stop="editSop(sop)"
              class="icon-btn"
              title="Edit"
            >
              <i class="mdi mdi-pencil"></i>
            </button>
            <button
              @click.stop="confirmDelete(sop)"
              class="icon-btn icon-btn-danger"
              title="Delete"
            >
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>

        <p class="card-description">{{ sop.description }}</p>

        <div class="card-meta">
          <div class="meta-item">
            <i class="mdi mdi-tag"></i>
            <span>{{ sop.category || 'Uncategorized' }}</span>
          </div>
          <div class="meta-item">
            <i class="mdi mdi-file-document"></i>
            <span>v{{ sop.version }}</span>
          </div>
          <div class="meta-item">
            <span :class="['badge', `badge-${sop.status}`]">
              {{ sop.status }}
            </span>
          </div>
        </div>

        <div class="card-footer">
          <small>{{ formatDate(sop.created_at) }}</small>
          <small v-if="sop.documents?.length">
            {{ sop.documents.length }} document(s)
          </small>
        </div>
      </div>
    </div>

    <!-- SOP Detail Panel -->
    <transition name="slide-right">
      <div v-if="selectedSop && !showCreateForm" class="sop-detail-panel">
        <div class="detail-header">
          <h2>{{ selectedSop.title }}</h2>
          <button @click="selectedSopId = null" class="btn-close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="detail-content">
          <!-- SOP Info -->
          <div class="detail-section">
            <h3>Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Description</span>
                <span class="value">{{ selectedSop.description || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Category</span>
                <span class="value">{{ selectedSop.category || 'Uncategorized' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Version</span>
                <span class="value">{{ selectedSop.version }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status</span>
                <span :class="['badge', `badge-${selectedSop.status}`]">
                  {{ selectedSop.status }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Created</span>
                <span class="value">{{ formatDate(selectedSop.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Documents Section -->
          <div class="detail-section">
            <div class="section-header">
              <h3>Documents</h3>
              <button
                @click="showDocumentUpload = !showDocumentUpload"
                class="btn-small"
              >
                <i class="mdi mdi-upload"></i>
                Upload Document
              </button>
            </div>

            <!-- Document Upload Form -->
            <transition name="slide">
              <div v-if="showDocumentUpload" class="upload-form">
                <div class="upload-box">
                  <input
                    type="file"
                    ref="fileInput"
                    @change="handleFileSelect"
                    class="file-input"
                    multiple
                  />
                  <div class="upload-area" @click="$refs.fileInput?.click()">
                    <i class="mdi mdi-cloud-upload-outline"></i>
                    <p>Click to upload or drag files here</p>
                    <small>Supported: PDF, DOC, DOCX, XLS, XLSX</small>
                  </div>
                </div>

                <div v-if="selectedFiles.length" class="selected-files">
                  <div
                    v-for="(file, idx) in selectedFiles"
                    :key="idx"
                    class="file-item"
                  >
                    <i class="mdi" :class="getFileIcon(file.name)"></i>
                    <span>{{ file.name }}</span>
                    <button @click="removeFile(idx)" class="btn-remove">
                      <i class="mdi mdi-close"></i>
                    </button>
                  </div>
                </div>

                <div class="upload-actions">
                  <button
                    @click="showDocumentUpload = false"
                    class="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    @click="uploadDocuments"
                    :disabled="!selectedFiles.length || uploadingFile"
                    class="btn-primary"
                  >
                    <i v-if="uploadingFile" class="mdi mdi-loading"></i>
                    Upload {{ selectedFiles.length }} File(s)
                  </button>
                </div>
              </div>
            </transition>

            <!-- Documents List -->
            <div v-if="selectedSop.documents?.length" class="documents-list">
              <div
                v-for="doc in selectedSop.documents"
                :key="doc.id"
                class="document-item"
              >
                <div class="doc-info">
                  <i class="mdi" :class="getFileIcon(doc.file_name)"></i>
                  <div class="doc-details">
                    <p class="doc-name">{{ doc.file_name }}</p>
                    <small>
                      {{ formatFileSize(doc.file_size) }} • v{{ doc.version }}
                    </small>
                  </div>
                </div>

                <div class="doc-actions">
                  <button
                    @click="previewDocument(doc)"
                    class="icon-btn"
                    title="Preview"
                  >
                    <i class="mdi mdi-eye-outline"></i>
                  </button>
                  <button
                    @click="handleDownload(doc)"
                    class="icon-btn"
                    title="Download"
                  >
                    <i class="mdi mdi-download"></i>
                  </button>
                  <button
                    @click="confirmDeleteDoc(doc)"
                    class="icon-btn icon-btn-danger"
                    title="Delete"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-documents">
              <i class="mdi mdi-file-document-outline"></i>
              <p>No documents uploaded yet</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Preview Modal -->
    <transition name="fade">
      <div v-if="previewUrl" class="modal-overlay" @click="previewUrl = null">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ previewDoc?.file_name }}</h3>
            <button @click="previewUrl = null" class="btn-close">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal-body">
            <iframe
              v-if="isPdfPreview"
              :src="previewUrl"
              class="pdf-viewer"
            ></iframe>
            <div v-else class="preview-unavailable">
              <i class="mdi mdi-file-document-outline"></i>
              <p>Preview not available for this file type</p>
              <button @click="previewDoc && handleDownload(previewDoc)" class="btn-primary">
                <i class="mdi mdi-download"></i>
                Download Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Confirm Delete Modal -->
    <transition name="fade">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
        <div class="modal-content modal-small" @click.stop>
          <div class="modal-body">
            <i class="mdi mdi-alert-circle"></i>
            <h3>{{ deleteItem.type === 'sop' ? 'Delete SOP?' : 'Delete Document?' }}</h3>
            <p>{{ deleteItem.name }}</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>

          <div class="modal-footer">
            <button @click="showDeleteConfirm = false" class="btn-secondary">
              Cancel
            </button>
            <button
              @click="performDelete"
              :disabled="loading"
              class="btn-danger"
            >
              <i v-if="loading" class="mdi mdi-loading"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
    </main-layout>
  
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSopLibrary, type SopItem, type SopDocument } from '@/composables/useSopLibrary'
import MainLayout from '@/components/Layouts/MainLayout.vue'

const {
  sops,
  currentSop,
  loading,
  error,
  searchQuery,
  filterCategory,
  filterStatus,
  uploadingFile,
  filteredSops,
  fetchSops,
  fetchSopById,
  createSop,
  updateSop,
  deleteSop,
  uploadSopDocument,
  deleteSopDocument,
  downloadDocument,
  getDocumentPreviewUrl,
  getCategories
} = useSopLibrary()

// Local state
const showCreateForm = ref(false)
const selectedSopId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const showDocumentUpload = ref(false)
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string | null>(null)
const previewDoc = ref<SopDocument | null>(null)
const categories = ref<string[]>([])
const showDeleteConfirm = ref(false)
const deleteItem = ref({ type: '', id: '', name: '' })

const formData = ref({
  title: '',
  description: '',
  category: '',
  version: '1.0',
  status: 'draft' as 'draft' | 'published'
})

// Computed
const selectedSop = computed(() => {
  return sops.value.find(s => s.id === selectedSopId.value) || null
})

const isPdfPreview = computed(() => {
  return previewDoc.value?.mime_type === 'application/pdf' ||
         previewDoc.value?.file_name.endsWith('.pdf')
})

// Methods
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    category: '',
    version: '1.0',
    status: 'draft'
  }
  editingId.value = null
}

const closeForm = () => {
  showCreateForm.value = false
  resetForm()
}

const saveSop = async () => {
  try {
    if (editingId.value) {
      await updateSop(editingId.value, formData.value)
    } else {
      await createSop(formData.value)
    }
    closeForm()
    await fetchSops()
  } catch (err) {
    console.error('Error saving SOP:', err)
  }
}

const editSop = (sop: SopItem) => {
  editingId.value = sop.id
  formData.value = {
    title: sop.title,
    description: sop.description || '',
    category: sop.category || '',
    version: sop.version,
    status: sop.status
  }
  showCreateForm.value = true
  selectedSopId.value = null
}

const selectSop = async (sop: SopItem) => {
  selectedSopId.value = sop.id
  await fetchSopById(sop.id)
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files) {
    selectedFiles.value = Array.from(files)
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const uploadDocuments = async () => {
  if (!selectedSop.value) return

  try {
    for (const file of selectedFiles.value) {
      await uploadSopDocument(selectedSop.value.id, file)
    }
    selectedFiles.value = []
    showDocumentUpload.value = false
    await fetchSopById(selectedSop.value.id)
  } catch (err) {
    console.error('Error uploading documents:', err)
  }
}

const previewDocument = async (doc: SopDocument) => {
  try {
    previewDoc.value = doc
    const url = await getDocumentPreviewUrl(doc.file_path)
    previewUrl.value = url
  } catch (err) {
    console.error('Error getting preview URL:', err)
  }
}

const handleDownload = (doc: SopDocument) => {
  downloadDocument(doc.file_path, doc.file_name)
}

const confirmDelete = (sop: SopItem) => {
  deleteItem.value = { type: 'sop', id: sop.id, name: sop.title }
  showDeleteConfirm.value = true
}

const confirmDeleteDoc = (doc: SopDocument) => {
  deleteItem.value = { type: 'document', id: doc.id, name: doc.file_name }
  showDeleteConfirm.value = true
}

const performDelete = async () => {
  try {
    if (deleteItem.value.type === 'sop') {
      await deleteSop(deleteItem.value.id)
    } else {
      const doc = selectedSop.value?.documents?.find(d => d.id === deleteItem.value.id)
      if (doc) {
        await deleteSopDocument(deleteItem.value.id, doc.file_path)
        await fetchSopById(selectedSop.value!.id)
      }
    }
    showDeleteConfirm.value = false
    await fetchSops()
  } catch (err) {
    console.error('Error deleting item:', err)
  }
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap: { [key: string]: string } = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    xls: 'mdi-file-excel-box',
    xlsx: 'mdi-file-excel-box',
    ppt: 'mdi-file-powerpoint-box',
    pptx: 'mdi-file-powerpoint-box',
    txt: 'mdi-file-document-outline',
    zip: 'mdi-file-zip-box'
  }
  return iconMap[ext || ''] || 'mdi-file-document-outline'
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// Lifecycle
onMounted(async () => {
  await fetchSops()
  categories.value = await getCategories()
})
</script>

<style>
/* Variables */
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --danger-color: #ef4444;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}

/* Main Container */
.sop-library {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
}

/* Header */
.sop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}

.sop-header-content {
  flex: 1;
}

.sop-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.sop-subtitle {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0.5rem 0 0 0;
}

/* Toolbar */
.sop-toolbar {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: var(--gray-200);
  color: var(--gray-700);
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: var(--gray-300);
}

.btn-danger {
  padding: 0.625rem 1.25rem;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  cursor: pointer;
}

.btn-small:hover {
  background: var(--primary-hover);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-500);
  transition: color 0.2s;
  padding: 0;
  line-height: 1;
}

.btn-close:hover {
  color: var(--gray-700);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--gray-100);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--gray-600);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.icon-btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.icon-btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger-color);
  font-size: 1.25rem;
  padding: 0;
  line-height: 1;
}

/* Form Styles */
.sop-form-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.sop-form {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.form-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--gray-900);
}

.form-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.875rem;
}

.input-field:focus,
.textarea-field:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.textarea-field {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* SOP Grid */
.sop-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  overflow-y: auto;
}

/* SOP Card */
.sop-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.sop-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.sop-card.active {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--gray-600);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-item i {
  font-size: 1rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
  font-size: 0.75rem;
  color: var(--gray-500);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-draft {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.badge-published {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.badge-archived {
  background: rgba(107, 114, 128, 0.1);
  color: var(--gray-600);
}

/* Detail Panel */
.sop-detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 450px;
  background: white;
  border-left: 1px solid var(--gray-200);
  z-index: 50;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.detail-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--gray-900);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 1rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--gray-500);
  letter-spacing: 0.05em;
}

.info-item .value {
  font-size: 0.875rem;
  color: var(--gray-900);
}

/* Upload Form */
.upload-form {
  background: var(--gray-50);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.upload-box {
  position: relative;
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.02);
}

.upload-area i {
  font-size: 2.5rem;
  color: var(--gray-400);
  display: block;
  margin-bottom: 0.5rem;
}

.upload-area p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
}

.upload-area small {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.selected-files {
  margin-bottom: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--gray-200);
}

.file-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.file-item span {
  flex: 1;
  font-size: 0.875rem;
  color: var(--gray-900);
  word-break: break-word;
}

.upload-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Documents List */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
}

.doc-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.doc-info i {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.doc-details {
  flex: 1;
  min-width: 0;
}

.doc-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
  word-break: break-word;
}

.doc-details small {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-600);
}

.doc-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.empty-documents {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gray-500);
}

.empty-documents i {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-documents p {
  margin: 0;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--gray-500);
  text-align: center;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.125rem;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  color: var(--gray-500);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Alert */
.alert {
  margin: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--gray-900);
}

.modal-body {
  padding: 2rem;
  text-align: center;
}

.modal-body i {
  font-size: 3rem;
  color: var(--primary-color);
  display: block;
  margin-bottom: 1rem;
}

.modal-body h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: var(--gray-900);
}

.modal-body p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.warning-text {
  color: var(--danger-color);
  font-weight: 500;
  margin-top: 1rem !important;
}

.pdf-viewer {
  width: 100%;
  height: 600px;
  border: none;
}

.preview-unavailable {
  padding: 2rem;
  text-align: center;
}

.preview-unavailable i {
  font-size: 3rem;
  color: var(--gray-400);
  display: block;
  margin-bottom: 1rem;
}

.preview-unavailable p {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .sop-header {
    flex-direction: column;
    gap: 1rem;
  }

  .sop-toolbar {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .sop-grid {
    grid-template-columns: 1fr;
  }

  .sop-detail-panel {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>