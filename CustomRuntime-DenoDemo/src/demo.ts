
// do initialize
const scf_host: string | undefined = Deno.env.get("SCF_RUNTIME_API");

const scf_port: string | undefined = Deno.env.get("SCF_RUNTIME_API_PORT");

const func_name: string | undefined = Deno.env.get("_HANDLER");

const ready_url = `http://${scf_host}:${scf_port}/runtime/init/ready`;

const event_url = `http://${scf_host}:${scf_port}/runtime/invocation/next`;

const response_url = `http://${scf_host}:${scf_port}/runtime/invocation/response`;

const error_url = `http://${scf_host}:${scf_port}/runtime/invocation/error`;

// post ready -- finish initialization
console.log(`post ${ready_url}`);

postData(ready_url, {msg:"deno ready"}).then(data => {
                console.log(`Initialize finish`);
                });

while (true) {
  // get event
  const response = await fetch(event_url);
  response.text().then(function(text) {
    console.log(`get event: ${text}`);
    processEvent(text);
  });

}

async function processEvent(evt='') {
  if (evt.length === 0) {
    postData(error_url, {msg: "error handling event"}).then(data => {
      console.log(`Error response: ${data}`);
    });
  } else {
    postData(response_url, {msg:`finish process event`}).then(data => {
      console.log(`invoke response: ${data}`);
    });
  }
}

// Example POST method implementation:
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.text(); // parses JSON response into native JavaScript objects
}


