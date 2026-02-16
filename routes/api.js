'use strict';

const Thread = require('../models/Thread');

module.exports = function (app) {

  /*
  =========================
  THREAD ROUTES
  =========================
  */

  app.route('/api/threads/:board')

    // CREATE THREAD
    .post(async function (req, res) {
      console.log(req.body);
      try {
        const board = req.params.board;
        const { text, delete_password } = req.body;

        const newThread = new Thread({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        await newThread.save();
        res.redirect('/b/' + board);

      } catch (err) {
        res.status(500).send('Error creating thread');
      }
    })

    // GET THREADS
    .get(async function (req, res) {
      try {
        const board = req.params.board;

        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        threads.forEach(thread => {

          thread.replycount = thread.replies.length;

          thread.replies = thread.replies
            .sort((a, b) => b.created_on - a.created_on)
            .slice(0, 3);

          delete thread.delete_password;
          delete thread.reported;

          thread.replies.forEach(reply => {
            delete reply.delete_password;
            delete reply.reported;
          });

        });

        res.json(threads);

      } catch (err) {
        res.status(500).send('Error fetching threads');
      }
    })

    // DELETE THREAD
    .delete(async function (req, res) {
      try {
        const { thread_id, delete_password } = req.body;

        const thread = await Thread.findById(thread_id);

        if (!thread || thread.delete_password !== delete_password) {
          return res.send("incorrect password");
        }

        await Thread.findByIdAndDelete(thread_id);

        res.send("success");

      } catch (err) {
        res.status(500).send("error");
      }
    })

    // REPORT THREAD
    .put(async function (req, res) {
      try {
        const { thread_id } = req.body;

        await Thread.findByIdAndUpdate(thread_id, {
          reported: true
        });

        res.send("reported");

      } catch (err) {
        res.status(500).send("error");
      }
    });



  /*
  =========================
  REPLIES ROUTES
  =========================
  */

  app.route('/api/replies/:board')

    // CREATE REPLY
    .post(async function (req, res) {
      try {
        const { thread_id, text, delete_password } = req.body;

        const reply = {
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        };

        await Thread.findByIdAndUpdate(thread_id, {
          $push: { replies: reply },
          bumped_on: new Date()
        });

        res.redirect('/b/' + req.params.board);

      } catch (err) {
        res.status(500).send("error");
      }
    })

    // GET REPLIES
    .get(async function (req, res) {
      try {
        const { thread_id } = req.query;

        const thread = await Thread.findById(thread_id).lean();

        if (!thread) return res.status(404).send("Thread not found");

        delete thread.delete_password;
        delete thread.reported;

        thread.replies.forEach(reply => {
          delete reply.delete_password;
          delete reply.reported;
        });

        res.json(thread);

      } catch (err) {
        res.status(500).send("error");
      }
    })

    // DELETE REPLY
    .delete(async function (req, res) {
      try {
        const { thread_id, reply_id, delete_password } = req.body;

        const thread = await Thread.findById(thread_id);

        const reply = thread.replies.id(reply_id);

        if (!reply || reply.delete_password !== delete_password) {
          return res.send("incorrect password");
        }

        reply.text = "[deleted]";

        await thread.save();

        res.send("success");

      } catch (err) {
        res.status(500).send("error");
      }
    })

    // REPORT REPLY
    .put(async function (req, res) {
      try {
        const { thread_id, reply_id } = req.body;

        await Thread.updateOne(
          { _id: thread_id, "replies._id": reply_id },
          { $set: { "replies.$.reported": true } }
        );

        res.send("reported");

      } catch (err) {
        res.status(500).send("error");
      }
    });

};
