import { Cloud, DELIMITER, REMOTE_DATA_PATH, REMOTE_EVENTS_PATH, REMOTE_EVENTS_PREFIX } from "./Cloud"

// Mock the AWS SDK entirely to avoid actual calls
jest.mock("@aws-sdk/client-s3", () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
    })),
    GetObjectCommand: jest.fn(),
    PutObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    DeleteObjectCommand: jest.fn(),
}))

describe("Cloud constants", () => {
    it("defines correct delimiter", () => {
        expect(DELIMITER).toBe("/")
    })

    it("defines correct remote data path", () => {
        expect(REMOTE_DATA_PATH).toBe("data")
    })

    it("defines correct remote events path", () => {
        expect(REMOTE_EVENTS_PATH).toBe("events")
    })

    it("defines correct remote events prefix", () => {
        expect(REMOTE_EVENTS_PREFIX).toBe("events/")
    })
})

describe("Cloud", () => {
    describe("constructor", () => {
        it("creates a Cloud instance with notify callback", () => {
            const notify = jest.fn()
            const cloud = new Cloud(notify)
            expect(cloud).toBeInstanceOf(Cloud)
        })
    })

    describe("checkHttpStatusCode (via reflection)", () => {
        let cloud: any
        let notify: jest.Mock

        beforeEach(() => {
            notify = jest.fn()
            cloud = new Cloud(notify)
        })

        it("throws for server errors (5xx)", () => {
            const err: any = { $metadata: { httpStatusCode: 500 } }
            expect(() => cloud.checkHttpStatusCode(err, 500)).toThrow()
            expect(err.desc).toBe("unexpected server error")
        })

        it("throws for 1xx status codes", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 100)).toThrow()
            expect(err.desc).toBe("unexpected server error")
        })

        it("throws for redirects except 304", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 301)).toThrow()
            expect(err.desc).toBe("unexpected redirect")
        })

        it("does not throw for 304 (Not Modified)", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 304)).not.toThrow()
        })

        it("throws with auth message for 401", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 401)).toThrow()
            expect(err.desc).toBe("missing authentication credentials")
        })

        it("throws with auth message for 403", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 403)).toThrow()
            expect(err.desc).toBe("invalid authentication credentials")
        })

        it("does not throw for 404 (ignored)", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 404)).not.toThrow()
        })

        it("throws for other 4xx errors", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 429)).toThrow()
            expect(err.desc).toContain("429")
        })

        it("throws for missing httpStatusCode", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, undefined)).toThrow()
            expect(err.desc).toBe("unexpected error")
        })

        it("does not throw for 2xx success codes", () => {
            const err: any = { $metadata: {} }
            expect(() => cloud.checkHttpStatusCode(err, 200)).not.toThrow()
            expect(() => cloud.checkHttpStatusCode(err, 204)).not.toThrow()
        })
    })

    describe("stripPrefixPath (via reflection)", () => {
        let cloud: any

        beforeEach(() => {
            cloud = new Cloud(jest.fn())
        })

        it("strips the events prefix", () => {
            expect(cloud.stripPrefixPath("events/abc-123")).toBe("abc-123")
        })

        it("returns original if no prefix", () => {
            expect(cloud.stripPrefixPath("no-prefix")).toBe("no-prefix")
        })

        it("handles empty string", () => {
            expect(cloud.stripPrefixPath("")).toBe("")
        })

        it("handles just the prefix", () => {
            expect(cloud.stripPrefixPath("events/")).toBe("")
        })
    })

    describe("withS3Client (via reflection)", () => {
        let cloud: any
        let notify: jest.Mock

        beforeEach(() => {
            notify = jest.fn()
            cloud = new Cloud(notify)
        })

        it("calls otherwise when credentials are missing", () => {
            const action = jest.fn()
            const otherwise = jest.fn()
            cloud.withS3Client({}, action, otherwise)
            expect(action).not.toHaveBeenCalled()
            expect(otherwise).toHaveBeenCalled()
        })

        it("calls otherwise when s3Bucket is missing", () => {
            const action = jest.fn()
            const otherwise = jest.fn()
            cloud.withS3Client(
                { awsAccessKey: "key", awsSecretKey: "secret", awsRegion: "us-east-1" },
                action,
                otherwise,
            )
            expect(action).not.toHaveBeenCalled()
            expect(otherwise).toHaveBeenCalled()
        })

        it("calls action with S3Client when all credentials provided", () => {
            const action = jest.fn()
            const otherwise = jest.fn()
            cloud.withS3Client(
                {
                    s3Bucket: "my-bucket",
                    awsAccessKey: "key",
                    awsSecretKey: "secret",
                    awsRegion: "us-east-1",
                },
                action,
                otherwise,
            )
            expect(action).toHaveBeenCalled()
            expect(otherwise).not.toHaveBeenCalled()
        })

        it("does not call otherwise if not provided and credentials missing", () => {
            const action = jest.fn()
            // Should not throw when otherwise is not provided
            expect(() => cloud.withS3Client({}, action)).not.toThrow()
            expect(action).not.toHaveBeenCalled()
        })
    })
})
