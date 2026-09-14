import { DEFAULT_DUE_DATE_PROPERTY, DEFAULT_SCHEDULED_DATE_PROPERTY } from '../constants'

export interface DatePropertySettings {
    defaultScheduledDateProperty: string
    defaultDueDateProperty: string
}

export interface ResolvedDateProperties {
    scheduled: string
    due: string
}

/**
 * Resolve the plugin-wide scheduling property names.
 *
 * Calendar, Timeline, WBS, Ideal week, Agenda, cards, and filters share this
 * contract. Legacy per-view keys and note-type snapshots intentionally do not
 * participate: neither is exposed as a supported override in the current UI.
 */
export function resolveDateProperties(settings: DatePropertySettings): ResolvedDateProperties {
    return {
        scheduled: settings.defaultScheduledDateProperty.trim() || DEFAULT_SCHEDULED_DATE_PROPERTY,
        due: settings.defaultDueDateProperty.trim() || DEFAULT_DUE_DATE_PROPERTY
    }
}
