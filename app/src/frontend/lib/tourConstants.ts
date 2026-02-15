export const TOUR_CATEGORIES = ['onboarding', 'card', 'board', 'sidebar'] as const
export type TourCategory = typeof TOUR_CATEGORIES[number]

export const TOUR_FINISHED = 999

export const TOUR_ORDER: Record<TourCategory, {next: TourCategory | null; steps: number}> = {
    onboarding: {next: 'card', steps: 1},
    card: {next: 'board', steps: 3},
    board: {next: 'sidebar', steps: 3},
    sidebar: {next: null, steps: 3},
}
