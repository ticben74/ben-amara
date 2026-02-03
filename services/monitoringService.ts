
export const logError = (error: Error, context: Record<string, any> = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent
  };
  
  // في بيئة حقيقية سيتم إرسال هذا إلى Sentry
  console.error('[Monitoring Error]', errorLog);
  
  const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
  localStorage.setItem('error_logs', JSON.stringify([errorLog, ...logs].slice(0, 50)));
};

export const trackPerformance = (name: string, duration: number) => {
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  // يمكن إرسال هذه البيانات لتحليل سرعة استجابة الـ API
};
