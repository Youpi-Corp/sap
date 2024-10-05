// @generated automatically by Diesel CLI.

diesel::table! {
    asset (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Nullable<Varchar>,
        content -> Nullable<Text>,
        documentation -> Nullable<Text>,
        likes -> Nullable<Int4>,
        views -> Nullable<Int4>,
        public -> Nullable<Bool>,
        user_id -> Nullable<Int4>,
        chat_id -> Nullable<Int4>,
    }
}

diesel::table! {
    chat (id) {
        id -> Int4,
        content -> Nullable<Text>,
    }
}

diesel::table! {
    course (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Nullable<Varchar>,
        content -> Nullable<Text>,
        module_id -> Nullable<Int4>,
        level -> Nullable<Int4>,
        likes -> Nullable<Int4>,
        views -> Nullable<Int4>,
        public -> Nullable<Bool>,
        chat_id -> Nullable<Int4>,
    }
}

diesel::table! {
    module (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Nullable<Varchar>,
        content -> Nullable<Text>,
        user_id -> Nullable<Int4>,
    }
}

diesel::table! {
    subscription (id) {
        id -> Int4,
        progress -> Nullable<Int4>,
        time_spent -> Nullable<Int4>,
        favorite -> Nullable<Bool>,
        liked -> Nullable<Bool>,
        user_id -> Nullable<Int4>,
        course_id -> Nullable<Int4>,
    }
}

diesel::table! {
    user (id) {
        id -> Int4,
        #[max_length = 100]
        pseudo -> Nullable<Varchar>,
        #[max_length = 100]
        email -> Nullable<Varchar>,
        password -> Nullable<Text>,
        #[max_length = 4]
        role -> Nullable<Varchar>,
    }
}

diesel::table! {
    info (cgu) {
        cgu -> Text,
        legal_mentions -> Nullable<Text>,
    }
}

diesel::joinable!(asset -> chat (chat_id));
diesel::joinable!(asset -> user (user_id));
diesel::joinable!(course -> chat (chat_id));
diesel::joinable!(course -> module (module_id));
diesel::joinable!(module -> user (user_id));
diesel::joinable!(subscription -> course (course_id));
diesel::joinable!(subscription -> user (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    asset,
    chat,
    course,
    module,
    subscription,
    user,
    info,
);
