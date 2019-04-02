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

  async applyConfig() {
    // Array to keep in mind the projects name and update date.
    this.projects = {};

    const query = "/4200534/projects.json";
    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user projects
    return this.oauth2ProxyRequest(proxyRequest).then((projects) => {

      logger.info("Let's configure the project table.");

      for (let project of projects) {
        logger.info("This is section inside the json: " + JSON.stringify(project));
        // Get name
        this.projects[project.name].name = project.name;
        // Get date
        this.projects[project.name].updated_at = project.updated_at;
        // Get url
        // url = project.app_url;

      }

    })
    .catch(error => {
      logger.error(
        `Got error sending request to service: ${JSON.stringify(error)}`);
      return q.Signal.error([
        'The Basecamp service returned an error. Please check your API key and account.',
        `Detail: ${error.message}`]);
    });

  }

  async getAllProjects() {
    const query = "/4200534/projects.json";
    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user projects
    return this.oauth2ProxyRequest(proxyRequest);
  }

  async run() {
    logger.info("Basecamp3 running.");
    return this.getAllProjects().then(projects => {
      let triggered = false;
      let message = [];

      this.timestamp = getTimestamp();

      logger.info("This is the json of the projects: " + JSON.stringify(projects));
      

      for (let project of projects) {
        logger.info("This is section inside the json: " + JSON.stringify(project));
        if(project.updated_at>this.projects[project.name].updated_at){
          // Need to send a signal         
          triggered=true;
          // Need to update the time
          this.projects[project.name].updated_at = project.updated_at;
          // Update signal's message
          message.push(`New update in ${project.name}.`);
        }

      }

      if (triggered) {

        // if (newUpdates.length == 1) {
        //   this.notification = "a new notification";
        // } else {
        //   this.notification = "new notifications";
        // }

        return new q.Signal({
          points: [
            [new q.Point(this.config.color, this.config.effect)]
          ],
          name: `Basecamp`,
          message: message.join("<br>"),
          link: {
            url: 'https://3.basecamp.com',
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