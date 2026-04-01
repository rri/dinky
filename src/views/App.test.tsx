import React from "react"
import { render, screen, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { App } from "./App"
import { Store } from "../models/Store"

// Mock Store
jest.mock("../models/Store")

// Mock uuid
jest.mock("uuid", () => ({
    v4: jest.fn(() => "mock-uuid"),
}))

// Mock matchMedia for theme detection
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
    };
};

describe("App", () => {
    let mockStoreInstance: any

    beforeEach(() => {
        mockStoreInstance = {
            loadFromDisk: jest.fn(),
            cloudSyncData: jest.fn(),
            putRetentionSettings: jest.fn(),
            putDisplaySettings: jest.fn(),
            putStorageSettings: jest.fn(),
            putItem: jest.fn(),
            tombstoneItems: jest.fn(),
            loadFromData: jest.fn(),
        }
        ;(Store as jest.Mock).mockImplementation(() => mockStoreInstance)
    })

    it("renders the main components", () => {
        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App />
            </MemoryRouter>
        )
        
        // Header/Nav elements
        expect(screen.getByText("Today")).toBeInTheDocument()
        expect(screen.getByText("Topics")).toBeInTheDocument()
        expect(screen.getByText("Tasks")).toBeInTheDocument()
        expect(screen.getByText("Notes")).toBeInTheDocument()
        expect(screen.getByText("Library")).toBeInTheDocument()
        
        // Search box
        expect(screen.getByPlaceholderText("Enter text to search...")).toBeInTheDocument()
    })

    it("loads data from disk on mount", () => {
        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App />
            </MemoryRouter>
        )
        
        expect(mockStoreInstance.loadFromDisk).toHaveBeenCalled()
    })
})
