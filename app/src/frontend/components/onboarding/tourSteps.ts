import type {TourCategory} from '../../lib/tourConstants'

export interface TourStep {
    step: number
    name: string
    title: string
    content: string
    targetSelector: string
    advanceOn: 'cardOpen' | 'propertiesAdded' | 'commentAdded' | 'descriptionEdited' | 'viewAdded' | 'linkCopied' | 'boardShared' | 'sidebarInteracted' | 'categoriesManaged' | 'searchUsed'
}

export const TOUR_STEPS: Record<TourCategory, TourStep[]> = {
    onboarding: [
        {
            step: 0,
            name: 'OPEN_A_CARD',
            title: 'Open a Card',
            content: 'Click on the "Getting Started" card to explore its features. You\'ll learn about properties, comments, and descriptions.',
            targetSelector: '[data-tour-target="onboarding-card-0"]',
            advanceOn: 'cardOpen',
        },
    ],

    card: [
        {
            step: 0,
            name: 'ADD_PROPERTIES',
            title: 'Add Card Properties',
            content: 'Properties help you organize and categorize cards. Try adding or editing a property like Status or Priority.',
            targetSelector: '[data-tour-target="card-properties"]',
            advanceOn: 'propertiesAdded',
        },
        {
            step: 1,
            name: 'ADD_COMMENTS',
            title: 'Add Comments',
            content: 'Collaborate with your team by adding comments to cards. Comments keep all discussions in context.',
            targetSelector: '[data-tour-target="card-comments"]',
            advanceOn: 'commentAdded',
        },
        {
            step: 2,
            name: 'ADD_DESCRIPTION',
            title: 'Add a Description',
            content: 'Descriptions provide detailed context for your cards. Try editing the description field.',
            targetSelector: '[data-tour-target="card-description"]',
            advanceOn: 'descriptionEdited',
        },
    ],

    board: [
        {
            step: 0,
            name: 'ADD_VIEW',
            title: 'Create Different Views',
            content: 'Views let you see your board in different ways. Try creating a Table or Calendar view to see your cards differently.',
            targetSelector: '[data-tour-target="add-view-button"]',
            advanceOn: 'viewAdded',
        },
        {
            step: 1,
            name: 'COPY_LINK',
            title: 'Copy Board Link',
            content: 'Share quick access to this board by copying its link. Find the share button in the toolbar.',
            targetSelector: '[data-tour-target="share-button"]',
            advanceOn: 'linkCopied',
        },
        {
            step: 2,
            name: 'SHARE_BOARD',
            title: 'Share with Your Team',
            content: 'Invite team members to collaborate on this board. Click the share button to manage permissions.',
            targetSelector: '[data-tour-target="share-button"]',
            advanceOn: 'boardShared',
        },
    ],

    sidebar: [
        {
            step: 0,
            name: 'SIDEBAR_NAVIGATION',
            title: 'Navigate Between Boards',
            content: 'The sidebar shows all your boards. Click on different boards to switch between them quickly.',
            targetSelector: '[data-tour-target="sidebar-boards"]',
            advanceOn: 'sidebarInteracted',
        },
        {
            step: 1,
            name: 'MANAGE_CATEGORIES',
            title: 'Organize with Categories',
            content: 'Group your boards into categories for better organization. Try creating or managing board categories.',
            targetSelector: '[data-tour-target="sidebar-categories"]',
            advanceOn: 'categoriesManaged',
        },
        {
            step: 2,
            name: 'SEARCH_BOARDS',
            title: 'Find Boards Quickly',
            content: 'Use the search feature to quickly find boards. Try typing in the "Find Boards" search box.',
            targetSelector: '[data-tour-target="sidebar-search"]',
            advanceOn: 'searchUsed',
        },
    ],
}
