import {createRouter} from '@tanstack/react-router'
import {Route as rootRoute} from './routes/__root'
import {Route as indexRoute} from './routes/index'
import {Route as loginRoute} from './routes/login'
import {Route as registerRoute} from './routes/register'
import {Route as changePasswordRoute} from './routes/change-password'
import {Route as authRoute} from './routes/_auth'
import {Route as dashboardRoute} from './routes/_auth.dashboard'
import {Route as boardRoute} from './routes/_auth.board.$boardId'
import {Route as cardRoute} from './routes/_auth.board.$boardId.$viewId.$cardId'
import {Route as settingsRoute} from './routes/_auth.settings'

const routeTree = rootRoute.addChildren([
    indexRoute,
    loginRoute,
    registerRoute,
    changePasswordRoute,
    authRoute.addChildren([
        dashboardRoute,
        settingsRoute,
        boardRoute.addChildren([
            cardRoute,
        ]),
    ]),
])

export const router = createRouter({routeTree})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
