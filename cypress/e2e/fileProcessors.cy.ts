
describe('processing file with Direct upload using APIs', () => {
  const fakeUser = {
    name: "test man",
    email: "tester@dcup.dev",
    provider: "google",
    image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
    plan: "OS"
  }

  beforeEach(() => {
    cy.visit("/")
  })
  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
  })


  it("should process files successfully when all conditions are met without metadata", () => {
    //   cy.task('addNewUser', fakeUser).then(user => {
    //     const u = user as typeof users.$inferSelect;
    //     cy.task('createApiKey', { id: u.id }).then(key => {
    //       const formData = new FormData();
    //       formData.append('links', 'test.pdf');
    //       cy.request({
    //         method: "POST",
    //         url: "/api/upload",
    //         headers: {
    //           "Authorization": `Bearer ${key}`
    //         },
    //         body: formData
    //       }).then(res => cy.log(res.body.toString()))
    //     });
    //   });
    // });
    //
    // const data = new FormData();
    // cy.task('addNewUser', fakeUser).then(user => {
    //   const u = user as typeof users.$inferSelect;
    //   cy.task('createApiKey', { id: u.id }).then(key => {
    //     cy.fixture("invo.pdf", 'binary')
    //       .then((file) => Cypress.Blob.binaryStringToBlob(file))
    //       .then((blob) => {
    //         cy.window().then(win => {
    //           const xhr = new win.XMLHttpRequest();
    //           data.set("files", blob, "test.pdf");
    //           xhr.open("POST", "/api/upload");
    //           xhr.setRequestHeader("Authorization", `Bearer ${key}`);
    //           xhr.send(data);
    //         }).then(response => {
    //           expect(response.status).to.eq(200);
    //         })
    //       })
    //   });
    // });
  });

  // create user with api key
  // create pdf file to upload
  // call the api 
  // check the database 
  // check the vector database
  it("should process files successfully when all conditions are met with metadata", () => {
    // create user with api key
    // create pdf file to upload
    // call the api 
    // check the database 
    // check the vector database
  })

  it("should process files successfully and remove indexed files when  when user remove one of them", () => {
    // create user with api key
    // create 2 pdfs files to upload
    // call the api 
    // check the database 
    // check the vector database
    // remove one the pdfs 
    // check the database
    // check the vector db 
  })
  it("should add new files to the connection when we add new file to the connection", () => {
    // create user with api key
    // create pdf file to upload
    // call the api 
    // check the database 
    // check the vector database
    // add new pdf to the same connection
    // check the vector database 
    // check the database
  })
  it("should remove all file from this connection when get deleted", () => {
    // create user with api key 
    // create 2 pdfs files to upload
    // call the api 
    // check the db 
    // check the vector database
    // remove the connection 
    // check the db 
    // check the vector database
  })
})
