import axios from "axios";

const MCP_URL = "http://localhost/mcp";

export async function listTools(token) {
  const res = await axios.post(MCP_URL, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  },
  {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      }
    }
  );

  return res.data.result.tools;
}

export async function callTool(token, name, arguments_) {
  try {
    const res = await axios.post(MCP_URL, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
        name,
        arguments: arguments_
        }
    },
    {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        }
    }
    );
    return res.data.result;
  } catch (err) {
    return normalizeHttpError(err);
  }
}

export async function listResources(token) {
  const res = await axios.post(
    MCP_URL,
    {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/list"
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      }
    }
  );

  return res.data.result.resources;
}

export async function readResource(token, uri, args = {}) {
  try {
    const res = await axios.post(
      MCP_URL,
      {
        jsonrpc: "2.0",
        id: 4,
        method: "resources/read",
        params: {
          uri,
          arguments: args
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        }
      }
    );

    return res.data.result;

  } catch (err) {
    return normalizeHttpError(err);
  }
}


function normalizeHttpError(err) {
  if (!err.response) {
    return {
      status: "error",
      error_code: "NETWORK_ERROR",
      message: "Unable to reach service",
      retryable: true
    };
  }

  switch (err.response.status) {
    case 401:
      return {
        status: "error",
        error_code: "UNAUTHORIZED",
        message: "Authentication failed",
        retryable: false
      };

    case 403:
      return {
        status: "error",
        error_code: "FORBIDDEN",
        message: "You do not have permission",
        retryable: false
      };

    case 422:
      return {
        status: "error",
        error_code: "VALIDATION_ERROR",
        message: err.response.data?.message || "Invalid input",
        retryable: false,
        fields: err.response.data?.errors || null
      };
    case 504:
      return {
        status: "error",
        error_code: "TIMEOUT",
        message: "The request timed out",
        retryable: true
      };

    case 500:
      return {
        status: "error",
        error_code: "SERVER_ERROR",
        message: "Internal server error",
        retryable: true
      };

    default:
      return {
        status: "error",
        error_code: "UNKNOWN_ERROR",
        message: "Unexpected error",
        retryable: true
      };
  }
}
