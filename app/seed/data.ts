export const SEED_DATA = {
    team: {
        id: "0",
        title: "Default Team",
        modifiedBy: "system"
    },
    users: [
        {
            email: "admin@focalboard.local",
            password: "AdminPassword123!",
            name: "Admin User",
            username: "admin",
            roles: "admin"
        },
        {
            email: "user@focalboard.local",
            password: "UserPassword123!",
            name: "Standard User",
            username: "user",
            roles: "user"
        },
        {
            email: "guest@focalboard.local",
            password: "GuestPassword123!",
            name: "Guest User",
            username: "guest",
            roles: "guest"
        }
    ],
    welcomeBoard: {
        title: "Welcome to Focalboard!",
        description: "This is your first board. Use it to track tasks, plan projects, or organize ideas.",
        icon: "wave",
        type: "O",
        cards: [
            {
                title: "Learn about boards",
                fields: {icon: "book", status: "To Do"},
            },
            {
                title: "Create your first card",
                fields: {icon: "pencil", status: "In Progress"},
            },
            {
                title: "Invite team members",
                fields: {icon: "people", status: "To Do"},
            },
        ]
    }
}
