import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attachmentsApi } from '../api/attachments'

export function useAttachments(cardId: string) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['attachments', cardId],
        queryFn: () => attachmentsApi.list(cardId),
        staleTime: 30000,
    })

    const uploadMutation = useMutation({
        mutationFn: (file: File) => attachmentsApi.upload(cardId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', cardId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => attachmentsApi.delete(cardId, attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', cardId] })
        },
    })

    return {
        attachments: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        upload: uploadMutation.mutate,
        isUploading: uploadMutation.isPending,
        uploadError: uploadMutation.error,
        deleteAttachment: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    }
}
