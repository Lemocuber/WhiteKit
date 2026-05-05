use std::{
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

#[tauri::command]
fn run_shell(command: String) -> ShellResult {
  let output = if cfg!(target_os = "windows") {
    Command::new("cmd").args(["/C", &command]).output()
  } else {
    Command::new("sh").args(["-lc", &command]).output()
  };

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

fn main() {
  require_elevation();

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![run_shell])
    .run(tauri::generate_context!())
    .expect("error while running WhiteKit");
}

fn require_elevation() {
  if is_elevated() {
    return;
  }

  eprintln!("{}", elevation_message());
  std::process::exit(1);
}

#[cfg(unix)]
fn is_elevated() -> bool {
  extern "C" {
    fn geteuid() -> u32;
  }

  unsafe { geteuid() == 0 }
}

#[cfg(windows)]
fn is_elevated() -> bool {
  Command::new("cmd")
    .args(["/C", "net", "session"])
    .stdout(std::process::Stdio::null())
    .stderr(std::process::Stdio::null())
    .status()
    .is_ok_and(|status| status.success())
}

#[cfg(not(any(unix, windows)))]
fn is_elevated() -> bool {
  false
}

#[cfg(target_os = "macos")]
fn elevation_message() -> &'static str {
  "WhiteKit must be run as root. Start it with sudo or an elevated launcher."
}

#[cfg(windows)]
fn elevation_message() -> &'static str {
  "WhiteKit must be run as Administrator."
}

#[cfg(not(any(target_os = "macos", windows)))]
fn elevation_message() -> &'static str {
  "WhiteKit must be run with elevated privileges."
}
