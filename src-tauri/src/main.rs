#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use std::{
  env,
  process::Command,
  string::String,
  thread,
  time::Duration,
};

use serde::Serialize;
use sysinfo::Networks;
use tauri::Emitter;

const NETWORK_SAMPLE_EVENT: &str = "network-traffic-sample";
const NETWORK_SAMPLE_INTERVAL: Duration = Duration::from_secs(1);
const ELEVATION_PREFIX: &str = "!SUDO ";

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellResult {
  stdout: String,
  stderr: String,
  exit_code: i32,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NetworkTrafficSample {
  bytes_last_second: u64,
}

fn shell_program_and_args(command: &str, shell_env: Option<&str>) -> (String, Vec<String>) {
  if cfg!(target_os = "windows") {
    return ("cmd".into(), vec!["/C".into(), command.into()]);
  }

  if cfg!(target_os = "macos") {
    let program = shell_env
      .filter(|shell| !shell.is_empty())
      .unwrap_or("/bin/zsh")
      .to_string();

    return (
      program,
      vec!["-l".into(), "-i".into(), "-c".into(), command.into()],
    );
  }

  ("sh".into(), vec!["-lc".into(), command.into()])
}

fn elevated_shell_program_and_args(command: &str) -> (String, Vec<String>) {
  if cfg!(target_os = "windows") {
    let script = format!(
      "$process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/C', {}) -Verb RunAs -Wait -PassThru -WindowStyle Hidden; exit $process.ExitCode",
      powershell_single_quoted(command)
    );

    return (
      "powershell".into(),
      vec!["-NoProfile".into(), "-Command".into(), script],
    );
  }

  if cfg!(target_os = "macos") {
    let script = format!(
      "do shell script {} with administrator privileges",
      applescript_string_literal(command)
    );

    return ("osascript".into(), vec!["-e".into(), script]);
  }

  shell_program_and_args(command, None)
}

fn strip_elevation_prefix(command: &str) -> Result<Option<&str>, &'static str> {
  match command.strip_prefix(ELEVATION_PREFIX) {
    Some(stripped) if stripped.trim().is_empty() => Err("!SUDO command cannot be empty"),
    Some(stripped) => Ok(Some(stripped)),
    None => Ok(None),
  }
}

fn applescript_string_literal(value: &str) -> String {
  format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn powershell_single_quoted(value: &str) -> String {
  format!("'{}'", value.replace('\'', "''"))
}

fn execute_command(program: String, args: Vec<String>) -> ShellResult {
  let mut shell = Command::new(program);
  shell.args(args);

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;

    shell.creation_flags(CREATE_NO_WINDOW);
  }

  let output = shell.output();

  match output {
    Ok(output) => ShellResult {
      stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
      stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
      exit_code: output.status.code().unwrap_or(-1),
    },
    Err(error) => ShellResult {
      stdout: String::new(),
      stderr: error.to_string(),
      exit_code: -1,
    },
  }
}

fn execute_shell(command: String) -> ShellResult {
  let shell_env = env::var("SHELL").ok();
  let (program, args) = match strip_elevation_prefix(&command) {
    Ok(Some(stripped)) => elevated_shell_program_and_args(stripped),
    Ok(None) => shell_program_and_args(&command, shell_env.as_deref()),
    Err(error) => {
      return ShellResult {
        stdout: String::new(),
        stderr: error.into(),
        exit_code: -1,
      }
    }
  };

  execute_command(program, args)
}

#[tauri::command]
async fn run_shell(command: String) -> ShellResult {
  tauri::async_runtime::spawn_blocking(move || execute_shell(command))
    .await
    .unwrap_or_else(|error| ShellResult {
      stdout: String::new(),
      stderr: error.to_string(),
      exit_code: -1,
    })
}

fn start_network_sampler(app_handle: tauri::AppHandle) {
  thread::spawn(move || {
    let mut networks = Networks::new_with_refreshed_list();

    loop {
      thread::sleep(NETWORK_SAMPLE_INTERVAL);
      networks.refresh(true);

      let bytes_last_second = networks
        .iter()
        .map(|(_, data)| data.received().saturating_add(data.transmitted()))
        .sum::<u64>();

      if app_handle
        .emit(
          NETWORK_SAMPLE_EVENT,
          NetworkTrafficSample { bytes_last_second },
        )
        .is_err()
      {
        break;
      }
    }
  });
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      start_network_sampler(app.handle().clone());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![run_shell])
    .run(tauri::generate_context!())
    .expect("error while running WhiteKit");
}

#[cfg(test)]
mod tests {
  use super::{
    applescript_string_literal, elevated_shell_program_and_args, powershell_single_quoted,
    shell_program_and_args, strip_elevation_prefix,
  };

  #[test]
  #[cfg(target_os = "macos")]
  fn macos_defaults_to_zsh_login_interactive_shell() {
    let (program, args) = shell_program_and_args("node --version", None);

    assert_eq!(program, "/bin/zsh");
    assert_eq!(args, vec!["-l", "-i", "-c", "node --version"]);
  }

  #[test]
  #[cfg(target_os = "macos")]
  fn macos_uses_shell_env_when_available() {
    let (program, args) = shell_program_and_args("codex --version", Some("/bin/bash"));

    assert_eq!(program, "/bin/bash");
    assert_eq!(args, vec!["-l", "-i", "-c", "codex --version"]);
  }

  #[test]
  #[cfg(target_os = "windows")]
  fn windows_uses_cmd_shell() {
    let (program, args) = shell_program_and_args("python --version", None);

    assert_eq!(program, "cmd");
    assert_eq!(args, vec!["/C", "python --version"]);
  }

  #[test]
  fn sudo_marker_is_stripped_only_at_command_start() {
    assert_eq!(
      strip_elevation_prefix("!SUDO installer -pkg app.pkg -target /"),
      Ok(Some("installer -pkg app.pkg -target /"))
    );
    assert_eq!(strip_elevation_prefix("echo !SUDO"), Ok(None));
  }

  #[test]
  fn empty_sudo_marker_is_invalid() {
    assert_eq!(
      strip_elevation_prefix("!SUDO    "),
      Err("!SUDO command cannot be empty")
    );
  }

  #[test]
  fn string_literals_escape_platform_shells() {
    assert_eq!(
      applescript_string_literal(r#"echo "hi" \ done"#),
      r#""echo \"hi\" \\ done""#
    );
    assert_eq!(
      powershell_single_quoted("echo 'hi'"),
      "'echo ''hi'''"
    );
  }

  #[test]
  #[cfg(target_os = "macos")]
  fn macos_elevated_commands_use_osascript_administrator_prompt() {
    let (program, args) = elevated_shell_program_and_args(r#"echo "hi""#);

    assert_eq!(program, "osascript");
    assert_eq!(
      args,
      vec![
        "-e",
        r#"do shell script "echo \"hi\"" with administrator privileges"#
      ]
    );
  }

  #[test]
  #[cfg(target_os = "windows")]
  fn windows_elevated_commands_use_uac_runas() {
    let (program, args) = elevated_shell_program_and_args("winget install Git.Git");

    assert_eq!(program, "powershell");
    assert_eq!(args[0], "-NoProfile");
    assert_eq!(args[1], "-Command");
    assert!(args[2].contains("Start-Process"));
    assert!(args[2].contains("-Verb RunAs"));
    assert!(args[2].contains("-WindowStyle Hidden"));
    assert!(args[2].contains("'winget install Git.Git'"));
  }
}
