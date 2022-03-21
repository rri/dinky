import { Wrapper } from "./Wrapper"
import banner from "../images/banner.webp"

export function Banner() {
    return (
        <Wrapper layout="row">
            <img src={banner} alt="" width="176.47px" height="40px" />
        </Wrapper>
    )
}
