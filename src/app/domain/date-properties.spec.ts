import { describe, expect, it } from 'bun:test'
import { resolveDateProperties } from './date-properties'

describe('resolveDateProperties', () => {
    it('uses custom plugin-wide property names', () => {
        expect(
            resolveDateProperties({
                defaultScheduledDateProperty: 'scheduled_on',
                defaultDueDateProperty: 'deadline_on'
            })
        ).toEqual({ scheduled: 'scheduled_on', due: 'deadline_on' })
    })

    it('trims names and falls back when stored settings are blank', () => {
        expect(
            resolveDateProperties({
                defaultScheduledDateProperty: '  planned_for  ',
                defaultDueDateProperty: '   '
            })
        ).toEqual({ scheduled: 'planned_for', due: 'date_due' })
    })

    it('ignores legacy view and note-type snapshots', () => {
        const settingsWithLegacySnapshots = {
            defaultScheduledDateProperty: 'scheduled_on',
            defaultDueDateProperty: 'deadline_on',
            scheduledDateProperty: 'date_scheduled',
            dueDateProperty: 'date_due',
            calendar: {
                scheduledDateProperty: 'date_scheduled',
                dueDateProperty: 'date_due'
            }
        }

        expect(resolveDateProperties(settingsWithLegacySnapshots)).toEqual({
            scheduled: 'scheduled_on',
            due: 'deadline_on'
        })
    })
})
