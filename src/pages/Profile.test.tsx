import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { Profile } from "./Profile"
import { DisplayTheme } from "../models/DisplaySettings"

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const defaultSettings = {
    storage: { 
        registry: { enabled: false, events: {} },
        s3Bucket: "my-bucket",
        awsRegion: "us-east-1",
    },
    retention: { periodDays: 30 },
    display: { theme: DisplayTheme.Auto },
}

const noop = () => {}
const noopHandler = (h: any) => {}

describe("Profile", () => {
    it("renders all sections", () => {
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={noop}
                    putDisplaySettings={noop}
                    putStorageSettings={noop}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={noop}
                    importData={noop}
                    sync={noop}
                />
            </BrowserRouter>
        )
        expect(screen.getByText("Cloud Sync")).toBeInTheDocument()
        expect(screen.getByText("Display Preferences")).toBeInTheDocument()
        expect(screen.getByText("Manage Your Data")).toBeInTheDocument()
        expect(screen.getByText("Retention period (days)")).toBeInTheDocument()
    })

    it("calls putRetentionSettings when retention period changes", () => {
        const putRetentionSettings = jest.fn()
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={putRetentionSettings}
                    putDisplaySettings={noop}
                    putStorageSettings={noop}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={noop}
                    importData={noop}
                    sync={noop}
                />
            </BrowserRouter>
        )
        const input = screen.getByDisplayValue("30")
        fireEvent.change(input, { target: { value: "60" } })
        // not saved while typing
        expect(putRetentionSettings).not.toHaveBeenCalled()
        fireEvent.blur(input)
        expect(putRetentionSettings).toHaveBeenCalledWith({ periodDays: 60 })
    })

    it("calls putDisplaySettings when theme changes", () => {
        const putDisplaySettings = jest.fn()
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={noop}
                    putDisplaySettings={putDisplaySettings}
                    putStorageSettings={noop}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={noop}
                    importData={noop}
                    sync={noop}
                />
            </BrowserRouter>
        )
        const lightRadio = screen.getByLabelText("Light")
        fireEvent.click(lightRadio)
        expect(putDisplaySettings).toHaveBeenCalledWith({ theme: DisplayTheme.Light })
    })

    it("calls putStorageSettings when S3 bucket changes", () => {
        const putStorageSettings = jest.fn()
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={noop}
                    putDisplaySettings={noop}
                    putStorageSettings={putStorageSettings}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={noop}
                    importData={noop}
                    sync={noop}
                />
            </BrowserRouter>
        )
        const input = screen.getByDisplayValue("my-bucket")
        fireEvent.change(input, { target: { value: "new-bucket" } })
        expect(putStorageSettings).toHaveBeenCalledWith(expect.objectContaining({ s3Bucket: "new-bucket" }))
    })

    it("calls sync when Sync button is clicked", () => {
        const sync = jest.fn()
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={noop}
                    putDisplaySettings={noop}
                    putStorageSettings={noop}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={noop}
                    importData={noop}
                    sync={sync}
                />
            </BrowserRouter>
        )
        fireEvent.click(screen.getByText("Sync"))
        expect(sync).toHaveBeenCalledWith(false)
        fireEvent.click(screen.getByText("Sync and compact data"))
        expect(sync).toHaveBeenLastCalledWith(true)
        expect(sync).toHaveBeenCalledTimes(2)
    })

    it("calls exportData when Export button is clicked", () => {
        const exportData = jest.fn()
        render(
            <BrowserRouter future={routerFuture}>
                <Profile
                    settings={defaultSettings as any}
                    putRetentionSettings={noop}
                    putDisplaySettings={noop}
                    putStorageSettings={noop}
                    registerExportHandler={noopHandler}
                    registerImportHandler={noopHandler}
                    exportData={exportData}
                    importData={noop}
                    sync={noop}
                />
            </BrowserRouter>
        )
        fireEvent.click(screen.getByText(/Export a copy/))
        expect(exportData).toHaveBeenCalled()
    })

    describe("number settings", () => {
        const renderProfile = (putRetentionSettings = jest.fn(), putStorageSettings = jest.fn()) => {
            render(
                <BrowserRouter future={routerFuture}>
                    <Profile
                        settings={{ ...defaultSettings, storage: { ...defaultSettings.storage, periodMinutes: 15 } } as any}
                        putRetentionSettings={putRetentionSettings}
                        putDisplaySettings={noop}
                        putStorageSettings={putStorageSettings}
                        registerExportHandler={noopHandler}
                        registerImportHandler={noopHandler}
                        exportData={noop}
                        importData={noop}
                        sync={noop}
                    />
                </BrowserRouter>
            )
            return { putRetentionSettings, putStorageSettings }
        }

        it("does not save an empty value, and restores the saved one", () => {
            const { putRetentionSettings } = renderProfile()
            const input = screen.getByDisplayValue("30") as HTMLInputElement
            fireEvent.change(input, { target: { value: "" } })
            fireEvent.blur(input)
            expect(putRetentionSettings).not.toHaveBeenCalled()
            expect(input.value).toBe("30")
        })

        it("does not save invalid values", () => {
            const { putRetentionSettings } = renderProfile()
            const input = screen.getByDisplayValue("30") as HTMLInputElement
            for (const value of ["abc", "-5", "1.5"]) {
                fireEvent.change(input, { target: { value } })
                fireEvent.blur(input)
                expect(input.value).toBe("30")
            }
            expect(putRetentionSettings).not.toHaveBeenCalled()
        })

        it("saves an explicit zero", () => {
            const { putRetentionSettings } = renderProfile()
            const input = screen.getByDisplayValue("30")
            fireEvent.change(input, { target: { value: "0" } })
            fireEvent.blur(input)
            expect(putRetentionSettings).toHaveBeenCalledWith({ periodDays: 0 })
        })

        it("saves on Enter", () => {
            const { putRetentionSettings } = renderProfile()
            const input = screen.getByDisplayValue("30")
            fireEvent.change(input, { target: { value: "45" } })
            fireEvent.keyDown(input, { key: "Enter" })
            expect(putRetentionSettings).toHaveBeenCalledWith({ periodDays: 45 })
        })

        it("restores the saved value on Escape", () => {
            const { putRetentionSettings } = renderProfile()
            const input = screen.getByDisplayValue("30") as HTMLInputElement
            fireEvent.change(input, { target: { value: "45" } })
            fireEvent.keyDown(input, { key: "Escape" })
            fireEvent.blur(input)
            expect(input.value).toBe("30")
            expect(putRetentionSettings).not.toHaveBeenCalled()
        })

        it("applies the same rules to the auto-sync period", () => {
            const { putStorageSettings } = renderProfile()
            const input = screen.getByDisplayValue("15") as HTMLInputElement
            fireEvent.change(input, { target: { value: "" } })
            fireEvent.blur(input)
            expect(putStorageSettings).not.toHaveBeenCalled()
            expect(input.value).toBe("15")
            fireEvent.change(input, { target: { value: "10" } })
            fireEvent.blur(input)
            expect(putStorageSettings).toHaveBeenCalledWith(expect.objectContaining({ periodMinutes: 10 }))
        })
    })
})
