// packages/lib/src/index.ts

// Export all modules
export * from './otp'
export * from './email'
export * from './sms'
export * from './utils'

// Export Redis functions
export { 
  redis, 
  getRedisPublisher, 
  createRedisSubscriber, 
  CHANNELS, 
  publishNotification, 
  incrementUnreadCount, 
  getUnreadCount, 
  resetUnreadCount, 
  saveFormSession, 
  getFormSession, 
  deleteFormSession, 
  closeRedisConnections 
} from './redis.js'