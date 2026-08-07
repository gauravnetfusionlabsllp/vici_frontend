// Re-exports the dashboardApi instance and all generated hooks.
// Endpoint logic lives in src/services/endpoints/*.
export { dashboardApi } from './api';
export { setSessionExpired, getSessionExpired } from './baseQuery';

export * from './endpoints/auth';
export * from './endpoints/dashboard';
export * from './endpoints/calls';
export * from './endpoints/leads';
export * from './endpoints/email';
export * from './endpoints/campaignLeads';
export * from './endpoints/reporting';
export * from './endpoints/leadManagement';
export * from './endpoints/managerView';
export * from './endpoints/whatsapp';
export * from './endpoints/waProxy';
export * from './endpoints/whatsappAutomation';
export * from './endpoints/doubleTick';
