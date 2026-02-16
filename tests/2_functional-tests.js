const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;

const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  // Guardamos IDs para reutilizar en tests
  const board = 'fcc_test_board';
  let thread_id;
  let reply_id;

  test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'fcc_test_thread', delete_password: 'delete_me' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
    chai.request(server)
      .get('/api/threads/' + board)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);

        // Agarramos el thread más reciente para usar en los siguientes tests
        if (res.body.length > 0) {
          thread_id = res.body[0]._id;
        }

        // No deben venir delete_password ni reported
        if (res.body.length > 0) {
          assert.notProperty(res.body[0], 'delete_password');
          assert.notProperty(res.body[0], 'reported');
          assert.isArray(res.body[0].replies);

          // Max 3 replies
          assert.isAtMost(res.body[0].replies.length, 3);

          if (res.body[0].replies.length > 0) {
            assert.notProperty(res.body[0].replies[0], 'delete_password');
            assert.notProperty(res.body[0].replies[0], 'reported');
          }
        }

        done();
      });
  });

  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function (done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .type('form')
      .send({ thread_id, delete_password: 'wrong_password' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function (done) {
    // Creamos uno específico para borrar correctamente sin romper el resto
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'thread_to_delete', delete_password: 'pass123' })
      .end(function (err, res) {
        assert.equal(res.status, 200);

        chai.request(server)
          .get('/api/threads/' + board)
          .end(function (err2, res2) {
            assert.equal(res2.status, 200);
            const delId = res2.body[0]._id;

            chai.request(server)
              .delete('/api/threads/' + board)
              .type('form')
              .send({ thread_id: delId, delete_password: 'pass123' })
              .end(function (err3, res3) {
                assert.equal(res3.status, 200);
                assert.equal(res3.text, 'success');
                done();
              });
          });
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
    chai.request(server)
      .put('/api/threads/' + board)
      .type('form')
      .send({ thread_id })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
    chai.request(server)
      .post('/api/replies/' + board)
      .type('form')
      .send({ thread_id, text: 'fcc_test_reply', delete_password: 'reply_pass' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
    chai.request(server)
      .get('/api/replies/' + board + '?thread_id=' + thread_id)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.equal(res.body._id, thread_id);

        // No deben venir delete_password ni reported
        assert.notProperty(res.body, 'delete_password');
        assert.notProperty(res.body, 'reported');

        assert.isArray(res.body.replies);
        if (res.body.replies.length > 0) {
          reply_id = res.body.replies[0]._id;
          assert.notProperty(res.body.replies[0], 'delete_password');
          assert.notProperty(res.body.replies[0], 'reported');
        }

        done();
      });
  });

  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function (done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .type('form')
      .send({ thread_id, reply_id, delete_password: 'wrong_pass' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function (done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .type('form')
      .send({ thread_id, reply_id, delete_password: 'reply_pass' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
    chai.request(server)
      .put('/api/replies/' + board)
      .type('form')
      .send({ thread_id, reply_id })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

});
