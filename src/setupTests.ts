import '@testing-library/jest-dom'

// Fail tests on any console.warn or console.error output.
// This ensures warnings and errors are addressed, not ignored.
const failOnConsole = (method: 'warn' | 'error') => {
    const original = console[method]
    beforeEach(() => {
        console[method] = (...args: any[]) => {
            original.apply(console, args)
            throw new Error(
                `console.${method} was called during test:\n${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`
            )
        }
    })
    afterEach(() => {
        console[method] = original
    })
}

failOnConsole('warn')
failOnConsole('error')
