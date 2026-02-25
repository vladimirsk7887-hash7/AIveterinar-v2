import { createLogger } from './logger.js';

const logger = createLogger();

/**
 * Get analytics for a clinic dashboard.
 * @param {Object} supabase - Supabase client
 * @param {string} clinicId - Clinic UUID
 * @param {Object} [opts] - { from, to }
 * @returns {Promise<Object>} analytics data
 */
export async function getClinicAnalytics(supabase, clinicId, opts = {}) {
  const from = opts.from || new Date(new Date().setDate(1)).toISOString();
  const to = opts.to || new Date().toISOString();

  try {
    // Conversations count
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', from)
      .lte('created_at', to);

    // Appointments count
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', from)
      .lte('created_at', to);

    // Status breakdown
    const { data: statusData } = await supabase
      .from('conversations')
      .select('status')
      .eq('clinic_id', clinicId)
      .gte('created_at', from)
      .lte('created_at', to);

    const statusBreakdown = {};
    for (const row of statusData || []) {
      statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
    }

    // API usage for current month
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const { data: usage } = await supabase
      .from('api_usage')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('month', month)
      .single();

    return {
      period: { from, to },
      conversations: totalConversations || 0,
      appointments: totalAppointments || 0,
      conversionRate: totalConversations
        ? Math.round((totalAppointments / totalConversations) * 100)
        : 0,
      statusBreakdown,
      usage: usage || null,
    };
  } catch (err) {
    logger.error({ clinicId, error: err.message }, 'Analytics query error');
    return { error: err.message };
  }
}
