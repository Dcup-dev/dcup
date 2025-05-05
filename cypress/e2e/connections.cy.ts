describe('connect to google drive', () => {
  const fakeUser = {
    id: "3abd5c17-7f80-4a3e-8c3e-7a24e0185aea",
    name: "test man",
    email: "tester@dcup.dev",
    provider: "google",
    image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
  }

  beforeEach(() => {
    // login
    cy.visit('/')
      .location('pathname')
      .should('eq', '/login')
      .task('addNewUser', fakeUser)
      .then((result) => {
        cy.loginNextAuth(result as any)
      })
      .visit('/')
      .location('pathname')
      .should('eq', '/')
  })

  it('should create new google drive connection ', () => {
    cy.visit("/connections/new")
      .get('[data-test="connection-card"]')
      .contains("Google Drive", { matchCase: false })
      .should("be.visible");
    // todo connected
  })
})
