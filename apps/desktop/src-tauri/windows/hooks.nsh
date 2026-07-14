!macro NSIS_HOOK_PREUNINSTALL
  ; Ensure context-menu keys added by runtime registration are removed.
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.pdf\shell\GiovanniQuick"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.pdf\shell\GiovanniOpen"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.pdf\shell\Giovanni"
!macroend
