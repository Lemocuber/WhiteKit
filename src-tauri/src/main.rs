use std::{
  env,
  process::Command,
  string::String,
};

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellResult {
  stdout: String,
  stderr: String,
  exit_code: i32,
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

fn main() {
  tauri::Builder::default()
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
