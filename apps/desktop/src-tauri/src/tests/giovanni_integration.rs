// Remplace 'nom_de_ton_app' par le 'name' dans ton Cargo.toml
use giovanni_app::giovanni::GiovanniEngine;

#[test]
fn test_full_pdf_metadata() {
    let engine = GiovanniEngine::new().expect("Lib C++ non chargée");

    // On crée un mini PDF valide (ou on en charge un vrai)
    // Pour le test, on peut utiliser un fichier de test dans ton repo
    let pdf_data = include_bytes!("../tests/sample.pdf");

    match engine.get_info(pdf_data) {
        Ok(info) => {
            println!("Nombre de pages : {}", info.num_pages);
            assert!(info.num_pages >= 0);
        },
        Err(e) => panic!("Erreur lors de la lecture du PDF : {}", e),
    }
}
