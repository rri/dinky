export class Term {

    private expR: RegExp | null
    private expS: string

    constructor(exp: string) {
        try {
            this.expR = new RegExp(exp, "ig")
            this.expS = exp
        } catch (e) {
            this.expR = null
            this.expS = exp
        }

    }

    public source(): string {
        return this.expS
    }

    public value(): RegExp | string {
        if (this.expR) {
            return this.expR
        } else {
            return this.expS
        }
    }

}
