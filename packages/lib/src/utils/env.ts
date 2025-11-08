export const env = {
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || '',
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || '587',
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || '',
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
}