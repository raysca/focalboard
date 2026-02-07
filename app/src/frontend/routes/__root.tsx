import {createRootRoute, Outlet, Link} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/router-devtools'
import {useAuth} from '../contexts/AuthContext'
import {useUI} from '../contexts/UIContext'
import {cn} from '../lib/cn'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const {theme} = useUI()

    return (
        <div className={cn("min-h-screen bg-center-bg text-center-fg font-sans antialiased", theme)}>
            <Outlet />
            {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
        </div>
    )
}
