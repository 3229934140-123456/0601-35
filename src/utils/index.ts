import dayjs from 'dayjs'
import type { BuildStatus } from '../types'

export const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '--'
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}分${secs > 0 ? secs + '秒' : ''}`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}小时${remainMins}分`
}

export const formatTime = (timestamp?: number, format: string = 'MM-DD HH:mm'): string => {
  if (!timestamp) return '--'
  return dayjs(timestamp).format(format)
}

export const formatFullTime = (timestamp?: number): string => {
  return formatTime(timestamp, 'YYYY-MM-DD HH:mm:ss')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const statusConfig: Record<BuildStatus, { label: string; color: string; bgColor: string }> = {
  success: { label: '成功', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  failed: { label: '失败', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  running: { label: '运行中', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  pending: { label: '排队中', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  canceled: { label: '已取消', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
  skipped: { label: '已跳过', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' }
}

export const getStatusLabel = (status: BuildStatus): string => statusConfig[status]?.label || status
export const getStatusColor = (status: BuildStatus): string => statusConfig[status]?.color || '#6b7280'

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const isInQuietHours = (startTime: string, endTime: string): boolean => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
}

export const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    gitlab: '🦊',
    github: '🐙',
    jenkins: '👷',
    coding: '💻'
  }
  return icons[platform] || '📦'
}
