import { Wrapper } from "./Wrapper"
import logo from "../images/logo.webp"

export function Logo() {
    return (
        <Wrapper layout="row">
            <img src={logo} alt="" height="80px" width="80px" />
        </Wrapper>
    )
}
