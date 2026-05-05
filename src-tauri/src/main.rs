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

fn execute_shell(command: String) -> ShellResult {
  let shell_env = env::var("SHELL").ok();
  let (program, args) = shell_program_and_args(&command, shell_env.as_deref());
  let output = Command::new(program).args(args).output();

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
  use super::shell_program_and_args;

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
}
