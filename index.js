const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://3.basecampapi.com';

//  https://3.basecamp.com/4200534/projects.json

function getTimestamp() {
  var d = new Date(Date.now()),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

class Basecamp extends q.DesktopApp {
  constructor() {
    super();
    this.timestamp = getTimestamp();
    // For checking plural or singular
    this.notification = "";
  }

  async getProjects() {
    const query = "/4200534/projects.json";
    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user projects
    return this.oauth2ProxyRequest(proxyRequest);
  }

  async getUpdates() {
    // first get the user workspaces
    return this.getProjects().then(json => {
      logger.info("This is the json of the projects: " + JSON.stringify(json));

      for (let section of json) {
        logger.info("This is section inside the json: " + JSON.stringify(section));
      }
      
      // if (user.workspaces && user.workspaces.length) {
      //   const workspaceId = user.workspaces[0].id;

      //   const query = `/workspaces/${workspaceId}/tasks/search`;
      //   const proxyRequest = new q.Oauth2ProxyRequest({
      //     apiKey: this.authorization.apiKey,
      //     uri: queryUrlBase + query,
      //     method: 'GET',
      //     qs: {
      //     },
      //   });
      //   return (this.oauth2ProxyRequest(proxyRequest));
      // }
      return null;
    });
  }

  async run() {
    logger.info("Basecamp3 running.");
    return this.getUpdates().then(newUpdates => {
      this.timestamp = getTimestamp();
      if (newUpdates && newUpdates.length > 0) {

        if (newUpdates.length == 1) {
          this.notification = "a new notification";
        } else {
          this.notification = "new notifications";
        }

        logger.info("Got " + newUpdates.length + this.notification);


        return new q.Signal({
          points: [
            [new q.Point("#0000FF", q.Effects.BLINK)]
          ],
          name: `Basecamp`,
          message: `You have ${this.notification}.`,
          link: {
            url: 'https://basecamp.com',
            label: 'Show in Basecamp',
          },
        });
      } else {
        return null;
      }
    }).catch(error => {
      const message = error.statusCode == 402
        ? 'Payment required. This applet requires a premium Basecamp account.' : error;
      logger.error(`Sending error signal: ${message}`);
      throw new Error(message);
    })
  }
}


module.exports = {
  Basecamp: Basecamp
}

const applet = new Basecamp();