import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"

export function NotFound() {
    return (
        <Wrapper layout="col">
            <Card title="Ummm...">
                <MsgBox emoji={"🗺️"}>Did you take a wrong turn?</MsgBox>
            </Card>
        </Wrapper >
    )
}
