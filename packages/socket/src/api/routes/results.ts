import { apiFactory } from "@razzia/socket/api/factory"
import { requireManagerOrService } from "@razzia/socket/api/middleware"
import {
  deleteResult,
  getResultById,
  getResultsMeta,
} from "@razzia/socket/services/config"
import { StatusCodes } from "http-status-codes"

const routes = apiFactory
  .createApp()
  .use(requireManagerOrService)
  // `?gameId=` y `?tenant=` acotan la lista; sin ellos sale completa
  .get("/", (c) =>
    c.json({
      results: getResultsMeta({
        gameId: c.req.query("gameId"),
        tenant: c.req.query("tenant"),
      }),
    }),
  )
  .get("/:id", (c) => c.json(getResultById(c.req.param("id"))))
  .delete("/:id", (c) => {
    deleteResult(c.req.param("id"))

    return c.body(null, StatusCodes.NO_CONTENT)
  })

export const results = routes
