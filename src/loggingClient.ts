import { Logging } from '@google-cloud/logging';

const loggingClient = new Logging();

async function writeLog(text: string) {

  // Selects the log to write to
  const log = loggingClient.log("botlog");

  // The metadata associated with the entry
  const metadata = {
    resource: { type: 'global' },
    // See: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
    severity: 'INFO',
  };

  // Prepares a log entry
  const entry = log.entry(metadata, text);

  // Writes the log entry
  await log.write(entry);
}
// if we're in prod, use this function to write to the GCP logs instead
export const log = process.env.NODE_ENV === "production" ? writeLog : console.log;
