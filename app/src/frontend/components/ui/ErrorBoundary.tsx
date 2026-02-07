import React from 'react'
import {AlertTriangle, RefreshCw} from 'lucide-react'
import {Button} from './Button'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {hasError: false, error: null}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {hasError: true, error}
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null})
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <AlertTriangle size={40} className="mx-auto mb-4 text-warning" />
                        <h2 className="text-lg font-semibold mb-2 text-center-fg">Something went wrong</h2>
                        <p className="text-sm text-center-fg/50 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            filled
                            onClick={this.handleRetry}
                            icon={<RefreshCw size={14} />}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
