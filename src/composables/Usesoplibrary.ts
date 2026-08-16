import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase' // Adjust path to your supabase client

export interface SopItem {
  id: string
  title: string
  description: string | null
  category: string | null
  version: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  documents?: SopDocument[]
}

export interface SopDocument {
  id: string
  sop_id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  version: string
  is_primary: boolean
  created_at: string
}

export interface CreateSopPayload {
  title: string
  description?: string
  category?: string
  version?: string
  status?: 'draft' | 'published'
}

export const useSopLibrary = () => {
  // State
  const sops = ref<SopItem[]>([])
  const currentSop = ref<SopItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const filterCategory = ref('')
  const filterStatus = ref('')
  const uploadingFile = ref(false)

  // Computed
  const filteredSops = computed(() => {
    return sops.value.filter(sop => {
      const matchesSearch = sop.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           sop.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesCategory = !filterCategory.value || sop.category === filterCategory.value
      const matchesStatus = !filterStatus.value || sop.status === filterStatus.value
      return matchesSearch && matchesCategory && matchesStatus
    })
  })

  // Fetch all SOPs
  const fetchSops = async (statusFilter?: string) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('sop_library')
        .select(`
          *,
          documents:sop_documents(*)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error: err } = await query

      if (err) throw err
      sops.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch SOPs'
      console.error('Error fetching SOPs:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch single SOP with documents
  const fetchSopById = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('sop_library')
        .select(`
          *,
          documents:sop_documents(*)
        `)
        .eq('id', id)
        .single()

      if (err) throw err
      currentSop.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch SOP'
      console.error('Error fetching SOP:', err)
    } finally {
      loading.value = false
    }
  }

  // Create new SOP
  const createSop = async (payload: CreateSopPayload) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('sop_library')
        .insert([
          {
            title: payload.title,
            description: payload.description || null,
            category: payload.category || null,
            version: payload.version || '1.0',
            status: payload.status || 'draft'
          }
        ])
        .select()
        .single()

      if (err) throw err
      sops.value.unshift(data)
      currentSop.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create SOP'
      console.error('Error creating SOP:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update SOP
  const updateSop = async (id: string, payload: Partial<CreateSopPayload>) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('sop_library')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      // Update in local state
      const index = sops.value.findIndex(s => s.id === id)
      if (index > -1) {
        sops.value[index] = data
      }
      if (currentSop.value?.id === id) {
        currentSop.value = data
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update SOP'
      console.error('Error updating SOP:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete SOP
  const deleteSop = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('sop_library')
        .delete()
        .eq('id', id)

      if (err) throw err

      sops.value = sops.value.filter(s => s.id !== id)
      if (currentSop.value?.id === id) {
        currentSop.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete SOP'
      console.error('Error deleting SOP:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Upload document to SOP
  const uploadSopDocument = async (
    sopId: string,
    file: File,
    isPrimary: boolean = false
  ): Promise<SopDocument> => {
    try {
      uploadingFile.value = true
      error.value = null

      // Generate unique file path
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const filePath = `${sopId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload file to storage
      const { error: uploadErr } = await supabase.storage
        .from('sop_documents')
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      // Create document record in database
      const { data, error: dbErr } = await supabase
        .from('sop_documents')
        .insert([
          {
            sop_id: sopId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            version: '1.0',
            is_primary: isPrimary
          }
        ])
        .select()
        .single()

      if (dbErr) throw dbErr

      // Update local state if SOP is loaded
      if (currentSop.value?.id === sopId) {
        currentSop.value.documents = currentSop.value.documents || []
        currentSop.value.documents.push(data)
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload document'
      console.error('Error uploading document:', err)
      throw err
    } finally {
      uploadingFile.value = false
    }
  }

  // Delete document
  const deleteSopDocument = async (docId: string, filePath: string) => {
    try {
      loading.value = true
      error.value = null

      // Delete from storage
      const { error: storageErr } = await supabase.storage
        .from('sop_documents')
        .remove([filePath])

      if (storageErr) throw storageErr

      // Delete from database
      const { error: dbErr } = await supabase
        .from('sop_documents')
        .delete()
        .eq('id', docId)

      if (dbErr) throw dbErr

      // Update local state
      if (currentSop.value?.documents) {
        currentSop.value.documents = currentSop.value.documents.filter(d => d.id !== docId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'
      console.error('Error deleting document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get download URL for document
  const getDocumentDownloadUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error: err } = await supabase.storage
        .from('sop_documents')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (err) throw err
      return data.signedUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get download URL'
      console.error('Error getting download URL:', err)
      throw err
    }
  }

  // Download document
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentDownloadUrl(filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download document'
      console.error('Error downloading document:', err)
    }
  }

  // Preview document (get signed URL)
  const getDocumentPreviewUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error: err } = await supabase.storage
        .from('sop_documents')
        .createSignedUrl(filePath, 3600)

      if (err) throw err
      return data.signedUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get preview URL'
      console.error('Error getting preview URL:', err)
      throw err
    }
  }

  // Get distinct categories
  const getCategories = async (): Promise<string[]> => {
    try {
      const { data, error: err } = await supabase
        .from('sop_library')
        .select('category')
        .not('category', 'is', null)
        .neq('status', 'archived')

      if (err) throw err

      const categories = new Set(data?.map(item => item.category).filter(Boolean))
      return Array.from(categories) as string[]
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  return {
    // State
    sops,
    currentSop,
    loading,
    error,
    searchQuery,
    filterCategory,
    filterStatus,
    uploadingFile,
    filteredSops,

    // Methods
    fetchSops,
    fetchSopById,
    createSop,
    updateSop,
    deleteSop,
    uploadSopDocument,
    deleteSopDocument,
    getDocumentDownloadUrl,
    downloadDocument,
    getDocumentPreviewUrl,
    getCategories
  }
}