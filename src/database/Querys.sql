-- ============================================
-- QUERIES ÚTILES PARA ANÁLISIS DE MÉTRICAS
-- ============================================

-- 1. Top 10 dispositivos más problemáticos (combinando alarmas + batería + offline)
SELECT 
  device_id,
  COALESCE(alarm_count, 0) as total_alarms,
  COALESCE(battery_count, 0) as battery_issues,
  COALESCE(offline_count, 0) as offline_events,
  COALESCE(total_offline_minutes, 0) as total_offline_minutes,
  (COALESCE(alarm_count, 0) * 3 + 
   COALESCE(battery_count, 0) * 2 + 
   COALESCE(offline_count, 0) * 5) as problem_score
FROM (
  SELECT DISTINCT device_id FROM alarm_events
  UNION
  SELECT DISTINCT device_id FROM battery_alerts
  UNION
  SELECT DISTINCT device_id FROM offline_events
) all_devices
LEFT JOIN (
  SELECT device_id, COUNT(*) as alarm_count
  FROM alarm_events
  WHERE timestamp > strftime('%s', 'now', '-30 days') * 1000
  GROUP BY device_id
) alarms USING (device_id)
LEFT JOIN (
  SELECT device_id, COUNT(*) as battery_count
  FROM battery_alerts
  WHERE timestamp > strftime('%s', 'now', '-30 days') * 1000
  GROUP BY device_id
) battery USING (device_id)
LEFT JOIN (
  SELECT device_id, 
         COUNT(*) as offline_count,
         SUM(duration_minutes) as total_offline_minutes
  FROM offline_events
  WHERE start_time > strftime('%s', 'now', '-30 days') * 1000
  GROUP BY device_id
) offline USING (device_id)
ORDER BY problem_score DESC
LIMIT 10;

-- 2. Análisis de tendencia semanal por día de la semana
SELECT 
  CASE CAST(strftime('%w', datetime(timestamp / 1000, 'unixepoch')) AS INTEGER)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as day_of_week,
  COUNT(*) as total_alarms,
  COUNT(DISTINCT device_id) as devices_affected,
  ROUND(AVG(COUNT(*)) OVER (), 2) as avg_alarms_per_day
FROM alarm_events
WHERE timestamp > strftime('%s', 'now', '-30 days') * 1000
GROUP BY strftime('%w', datetime(timestamp / 1000, 'unixepoch'))
ORDER BY CAST(strftime('%w', datetime(timestamp / 1000, 'unixepoch')) AS INTEGER);

-- 3. Análisis de horas pico de alarmas
SELECT 
  strftime('%H:00', datetime(timestamp / 1000, 'unixepoch', 'localtime')) as hour,
  COUNT(*) as alarm_count,
  COUNT(DISTINCT device_id) as devices_affected
FROM alarm_events
WHERE timestamp > strftime('%s', 'now', '-7 days') * 1000
GROUP BY strftime('%H', datetime(timestamp / 1000, 'unixepoch', 'localtime'))
ORDER BY alarm_count DESC;

-- 4. Dispositivos con degradación de batería
SELECT 
  device_id,
  MIN(battery_level) as min_battery,
  MAX(battery_level) as max_battery,
  AVG(battery_level) as avg_battery,
  COUNT(*) as total_readings,
  SUM(CASE WHEN charging = 0 THEN 1 ELSE 0 END) as times_not_charging
FROM heartbeats
WHERE timestamp > strftime('%s', 'now', '-7 days') * 1000
GROUP BY device_id
HAVING avg_battery < 50
ORDER BY avg_battery ASC;

-- 5. Frecuencia de alarmas por dispositivo (últimos 30 días)
WITH daily_alarms AS (
  SELECT 
    device_id,
    DATE(timestamp / 1000, 'unixepoch') as alarm_date,
    COUNT(*) as alarms_that_day
  FROM alarm_events
  WHERE timestamp > strftime('%s', 'now', '-30 days') * 1000
  GROUP BY device_id, alarm_date
)
SELECT 
  device_id,
  COUNT(DISTINCT alarm_date) as days_with_alarms,
  SUM(alarms_that_day) as total_alarms,
  ROUND(AVG(alarms_that_day), 2) as avg_alarms_per_active_day,
  MAX(alarms_that_day) as max_alarms_in_one_day
FROM daily_alarms
GROUP BY device_id
HAVING total_alarms > 10
ORDER BY total_alarms DESC;

-- 6. Patrón de desconexiones - Dispositivos que se desconectan frecuentemente
SELECT 
  device_id,
  COUNT(*) as total_disconnections,
  ROUND(AVG(duration_minutes), 2) as avg_duration_minutes,
  MAX(duration_minutes) as max_duration_minutes,
  SUM(duration_minutes) as total_offline_minutes
FROM offline_events
WHERE start_time > strftime('%s', 'now', '-30 days') * 1000
  AND end_time IS NOT NULL
GROUP BY device_id
HAVING total_disconnections > 5
ORDER BY total_disconnections DESC;

-- 7. Correlación entre batería baja y alarmas
SELECT 
  a.device_id,
  COUNT(DISTINCT DATE(a.timestamp / 1000, 'unixepoch')) as days_with_alarms,
  COUNT(DISTINCT DATE(b.timestamp / 1000, 'unixepoch')) as days_with_battery_alerts,
  COUNT(DISTINCT CASE 
    WHEN DATE(a.timestamp / 1000, 'unixepoch') = DATE(b.timestamp / 1000, 'unixepoch')
    THEN DATE(a.timestamp / 1000, 'unixepoch')
  END) as days_with_both
FROM alarm_events a
LEFT JOIN battery_alerts b ON a.device_id = b.device_id
WHERE a.timestamp > strftime('%s', 'now', '-30 days') * 1000
GROUP BY a.device_id
HAVING days_with_both > 0
ORDER BY days_with_both DESC;

-- 8. Resumen mensual completo
SELECT 
  strftime('%Y-%m', datetime(timestamp / 1000, 'unixepoch')) as month,
  COUNT(*) as total_alarms,
  COUNT(DISTINCT device_id) as unique_devices,
  ROUND(CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT device_id), 2) as avg_alarms_per_device
FROM alarm_events
WHERE timestamp > strftime('%s', 'now', '-6 months') * 1000
GROUP BY month
ORDER BY month DESC;

-- 9. Dispositivos que nunca han tenido problemas (candidatos para estudiar)
SELECT device_id
FROM (
  SELECT DISTINCT device_id FROM heartbeats
) all_devices
WHERE device_id NOT IN (SELECT DISTINCT device_id FROM alarm_events)
  AND device_id NOT IN (SELECT DISTINCT device_id FROM battery_alerts WHERE battery_level < 20)
  AND device_id NOT IN (
    SELECT DISTINCT device_id FROM offline_events 
    WHERE duration_minutes > 60
  );

-- 10. Análisis de recuperación - Tiempo promedio hasta primera alarma después de offline
WITH offline_alarms AS (
  SELECT 
    o.device_id,
    o.end_time as back_online,
    MIN(a.timestamp) as first_alarm_after,
    (MIN(a.timestamp) - o.end_time) / 60000 as minutes_until_alarm
  FROM offline_events o
  JOIN alarm_events a ON o.device_id = a.device_id
  WHERE o.end_time IS NOT NULL
    AND a.timestamp > o.end_time
    AND a.timestamp < o.end_time + (24 * 60 * 60 * 1000) -- dentro de 24h
  GROUP BY o.device_id, o.end_time
)
SELECT 
  device_id,
  COUNT(*) as reconnections_with_alarm,
  ROUND(AVG(minutes_until_alarm), 2) as avg_minutes_until_alarm,
  MIN(minutes_until_alarm) as fastest_alarm,
  MAX(minutes_until_alarm) as slowest_alarm
FROM offline_alarms
GROUP BY device_id
ORDER BY avg_minutes_until_alarm ASC;
