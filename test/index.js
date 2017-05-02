import test from "tape"
import koaI18nextDetector from "../src"

test("koaI18nextDetector", (t) => {
  t.plan(1)
  t.equal(true, koaI18nextDetector(), "return true")
})
